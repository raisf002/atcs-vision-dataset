#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { buildHlsFrameArgs, formatCaptureFailure, hlsRetryDelayMs, isTransientHlsFailure } from "./hls.mjs";
import { withRetry } from "./retry.mjs";

const baseUrl = (process.env.CAPTURE_API_BASE ?? "").replace(/\/$/, "");
const ingestToken = process.env.CAPTURE_WORKER_INGEST_TOKEN ?? "";
const maxParallel = Math.max(1, Math.min(Number(process.env.WORKER_MAX_PARALLEL ?? 6), 12));
const timeoutMs = Math.max(5_000, Number(process.env.WORKER_TIMEOUT_MS ?? 25_000));
const maxAttempts = Math.max(1, Math.min(Number(process.env.WORKER_MAX_ATTEMPTS ?? 4), 4));
const statePath = resolve(process.env.WORKER_STATE_PATH ?? "./state/capture-state.json");

if (!baseUrl || !ingestToken) throw new Error("CAPTURE_API_BASE dan CAPTURE_WORKER_INGEST_TOKEN wajib diatur");

async function loadState() {
  try { return JSON.parse(await readFile(statePath, "utf8")); } catch { return {}; }
}

async function saveState(state) {
  await mkdir(dirname(statePath), { recursive: true });
  const temporary = `${statePath}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2));
  await rename(temporary, statePath);
}

function isDue(camera, state, now) {
  const intervalMs = Number(camera.captureIntervalMinutes ?? 5) * 60_000;
  const lastCapture = Date.parse(state[camera.id] ?? camera.lastCaptureAt ?? 0);
  return !Number.isFinite(lastCapture) || now - lastCapture >= intervalMs;
}

function captureFrame(sourceUrl) {
  return new Promise((resolveCapture, rejectCapture) => {
    const process = spawn("ffmpeg", buildHlsFrameArgs(sourceUrl), { stdio: ["ignore", "pipe", "pipe"] });
    const output = [];
    const errors = [];
    const timeout = setTimeout(() => process.kill("SIGKILL"), timeoutMs);
    process.stdout.on("data", (chunk) => output.push(chunk));
    process.stderr.on("data", (chunk) => errors.push(chunk));
    process.on("error", rejectCapture);
    process.on("close", (code) => {
      clearTimeout(timeout);
      const image = Buffer.concat(output);
      if (code !== 0 || !image.length) return rejectCapture(new Error(Buffer.concat(errors).toString("utf8").trim() || `ffmpeg exit ${code}`));
      resolveCapture(image);
    });
  });
}

function jpegDimensions(buffer) {
  for (let index = 0; index < buffer.length - 9; index++) {
    if (buffer[index] !== 0xff || buffer[index + 1] < 0xc0 || buffer[index + 1] > 0xc3) continue;
    return { height: buffer.readUInt16BE(index + 5), width: buffer.readUInt16BE(index + 7) };
  }
  return {};
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { authorization: `Bearer ${ingestToken}`, ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`${path} (${response.status}): ${await response.text()}`);
  return response.json();
}

async function reportFailure(cameraId, error) {
  try { await api("/api/worker/failure", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cameraId, message: String(error.message ?? error).slice(0, 4000) }) }); } catch (reportError) { console.error(`Failure report ${cameraId}:`, reportError.message); }
}

async function captureCamera(camera, state) {
  const capturedAt = new Date();
  try {
    const image = await withRetry(() => captureFrame(camera.sourceUrl), {
      attempts: maxAttempts,
      delayMs: 750,
      getDelayMs: (error, attempt) => isTransientHlsFailure(error) ? hlsRetryDelayMs(attempt) : 750 * attempt,
      onAttemptFailure: (error, attempt, waitMs) => console.warn(`Capture ${camera.id} attempt ${attempt}/${maxAttempts} failed; retry in ${waitMs}ms:`, error.message),
    });
    const dimensions = jpegDimensions(image);
    await api("/api/worker/ingest", { method: "PUT", headers: { "content-type": "image/jpeg", "x-camera-id": camera.id, "x-captured-at": capturedAt.toISOString(), ...(dimensions.width ? { "x-capture-width": String(dimensions.width), "x-capture-height": String(dimensions.height) } : {}) }, body: image });
    state[camera.id] = capturedAt.toISOString();
    console.log(`Captured ${camera.id}`);
  } catch (error) {
    const message = formatCaptureFailure(error, maxAttempts);
    console.error(`Capture ${camera.id} failed after ${maxAttempts} attempt(s):`, message);
    await reportFailure(camera.id, new Error(message));
  }
}

async function run() {
  const { cameras } = await api("/api/worker/cameras");
  const state = await loadState();
  const due = cameras.filter((camera) => isDue(camera, state, Date.now()));
  for (let index = 0; index < due.length; index += maxParallel) await Promise.all(due.slice(index, index + maxParallel).map((camera) => captureCamera(camera, state)));
  await saveState(state);
  console.log(`Worker complete: ${due.length}/${cameras.length} camera due`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
