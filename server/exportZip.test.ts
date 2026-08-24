import express from "express";
import { execFileSync } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerExportZipRoute } from "./exportZip";
import { sdk } from "./_core/sdk";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("dataset ZIP export", () => {
  it("streams an admin-selected snapshot as a ZIP archive", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({
      id: 1, openId: "test-admin", name: "Test Admin", email: null, loginMethod: "test", role: "admin",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });

    const app = express();
    registerExportZipRoute(app);
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server address unavailable");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/exports/zip?cameraId=rancabango-bantar`);
    expect(response.status, await response.clone().text()).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/zip");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

    const archivePath = join(tmpdir(), `atcs-export-${Date.now()}.zip`);
    await writeFile(archivePath, bytes);
    try {
      execFileSync("unzip", ["-t", archivePath], { stdio: "pipe" });
    } finally {
      await rm(archivePath, { force: true });
    }
  }, 20_000);

  it("rejects a non-admin user before resolving export snapshots", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({
      id: 2, openId: "test-user", name: "Test User", email: null, loginMethod: "test", role: "user",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });

    const app = express();
    registerExportZipRoute(app);
    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server address unavailable");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/exports/zip?cameraId=rancabango-bantar`);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "admin_only" });
  });
});
