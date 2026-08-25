import { createHash } from "node:crypto";
import { decode } from "jpeg-js";

export const DEFAULT_YOLO_CLASSES = ["car", "truck", "bus", "motorcycle"] as const;

export type TrainingSplit = "train" | "val" | "test";

export type TrainingSnapshot = {
  id: number;
  cameraId: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

export type TrainingAnnotation = {
  snapshotId: number;
  yoloText: string;
  status: "draft" | "approved" | "rejected";
};

export type QualityResult = {
  ok: boolean;
  fingerprint: string;
  blurVariance: number;
  reason?: "unreadable" | "blur" | "duplicate";
};

export type TrainingManifestEntry = {
  snapshotId: number;
  cameraId: string;
  split: TrainingSplit;
  image: string;
  label: string;
  blurVariance: number;
};

export type TrainingPlan = {
  classMap: string[];
  entries: TrainingManifestEntry[];
  labelsBySnapshotId: Map<number, string>;
  excluded: Array<{ snapshotId: number; reason: string }>;
  quality: { accepted: number; unannotated: number; invalidLabel: number; blurry: number; duplicate: number; unreadable: number };
};

function clampClassMap(classMap: string[]) {
  return classMap.map((label) => label.trim()).filter(Boolean).slice(0, 64);
}

export function getDeterministicSplit(seed: string): TrainingSplit {
  const bucket = createHash("sha256").update(seed).digest().readUInt32BE(0) % 100;
  if (bucket < 70) return "train";
  if (bucket < 90) return "val";
  return "test";
}

export function getImageArchivePath(snapshot: TrainingSnapshot, split: TrainingSplit) {
  const fileName = snapshot.storageKey.split("/").at(-1) ?? `snapshot-${snapshot.id}.jpg`;
  return `images/${split}/${snapshot.cameraId}/${fileName}`;
}

export function getLabelArchivePath(snapshot: TrainingSnapshot, split: TrainingSplit) {
  return getImageArchivePath(snapshot, split).replace(/^images\//, "labels/").replace(/\.[^.]+$/, ".txt");
}

export function validateYoloLabel(yoloText: string, classCount: number): { valid: true; normalized: string } | { valid: false; error: string } {
  const rows = yoloText.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (rows.length === 0) return { valid: false, error: "Label YOLO kosong" };
  const normalized: string[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const values = row.split(/\s+/).map((value: string) => Number(value));
    if (values.length !== 5 || values.some((value) => !Number.isFinite(value))) return { valid: false, error: `Baris ${index + 1} harus berisi lima angka` };
    const [classId, x, y, width, height] = values;
    if (!Number.isInteger(classId) || classId < 0 || classId >= classCount) return { valid: false, error: `Class id pada baris ${index + 1} tidak ada di class map` };
    if (x < 0 || x > 1 || y < 0 || y > 1 || width <= 0 || width > 1 || height <= 0 || height > 1 || x - width / 2 < 0 || x + width / 2 > 1 || y - height / 2 < 0 || y + height / 2 > 1) return { valid: false, error: `Bounding box pada baris ${index + 1} berada di luar frame ternormalisasi` };
    normalized.push(`${classId} ${x} ${y} ${width} ${height}`);
  }
  return { valid: true, normalized: normalized.join("\n") + "\n" };
}

function estimateLaplacianVariance(rgba: Uint8Array, width: number, height: number) {
  if (width < 3 || height < 3) return 0;
  const step = Math.max(1, Math.floor(Math.max(width, height) / 320));
  let count = 0;
  let sum = 0;
  let squaredSum = 0;
  const luminance = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    return 0.2126 * rgba[offset] + 0.7152 * rgba[offset + 1] + 0.0722 * rgba[offset + 2];
  };
  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const center = luminance(x, y);
      const laplacian = luminance(x - step, y) + luminance(x + step, y) + luminance(x, y - step) + luminance(x, y + step) - 4 * center;
      sum += laplacian;
      squaredSum += laplacian * laplacian;
      count += 1;
    }
  }
  if (!count) return 0;
  return Math.max(0, squaredSum / count - (sum / count) ** 2);
}

export function inspectJpegQuality(data: Uint8Array, blurThreshold = 18): QualityResult {
  const fingerprint = createHash("sha256").update(data).digest("hex");
  try {
    const image = decode(Buffer.from(data), { useTArray: true });
    const blurVariance = estimateLaplacianVariance(image.data, image.width, image.height);
    if (blurVariance < blurThreshold) return { ok: false, fingerprint, blurVariance, reason: "blur" };
    return { ok: true, fingerprint, blurVariance };
  } catch {
    return { ok: false, fingerprint, blurVariance: 0, reason: "unreadable" };
  }
}

export function buildTrainingPlan(input: {
  snapshots: TrainingSnapshot[];
  annotations: TrainingAnnotation[];
  classMap: string[];
  qualities: Map<number, QualityResult>;
}): TrainingPlan {
  const classMap = clampClassMap(input.classMap);
  const annotationBySnapshotId = new Map(input.annotations.map((annotation) => [annotation.snapshotId, annotation]));
  const fingerprints = new Set<string>();
  const entries: TrainingManifestEntry[] = [];
  const labelsBySnapshotId = new Map<number, string>();
  const excluded: TrainingPlan["excluded"] = [];
  const quality = { accepted: 0, unannotated: 0, invalidLabel: 0, blurry: 0, duplicate: 0, unreadable: 0 };

  for (const snapshot of input.snapshots) {
    const annotation = annotationBySnapshotId.get(snapshot.id);
    if (!annotation || annotation.status !== "approved") {
      excluded.push({ snapshotId: snapshot.id, reason: "label_belum_disetujui" });
      quality.unannotated += 1;
      continue;
    }
    const label = validateYoloLabel(annotation.yoloText, classMap.length);
    if (!label.valid) {
      excluded.push({ snapshotId: snapshot.id, reason: label.error });
      quality.invalidLabel += 1;
      continue;
    }
    const result = input.qualities.get(snapshot.id);
    if (!result || !result.ok) {
      const reason = result?.reason ?? "unreadable";
      excluded.push({ snapshotId: snapshot.id, reason });
      quality[reason === "blur" ? "blurry" : "unreadable"] += 1;
      continue;
    }
    if (fingerprints.has(result.fingerprint)) {
      excluded.push({ snapshotId: snapshot.id, reason: "duplicate" });
      quality.duplicate += 1;
      continue;
    }
    fingerprints.add(result.fingerprint);
    const split = getDeterministicSplit(snapshot.storageKey);
    entries.push({ snapshotId: snapshot.id, cameraId: snapshot.cameraId, split, image: getImageArchivePath(snapshot, split), label: getLabelArchivePath(snapshot, split), blurVariance: Number(result.blurVariance.toFixed(2)) });
    labelsBySnapshotId.set(snapshot.id, label.normalized);
    quality.accepted += 1;
  }
  return { classMap, entries, labelsBySnapshotId, excluded, quality };
}

export function createDatasetYaml(classMap: string[]) {
  const names = clampClassMap(classMap).map((label, index) => `  ${index}: ${JSON.stringify(label)}`).join("\n");
  return ["path: .", "train: images/train", "val: images/val", "test: images/test", "names:", names, ""].join("\n");
}
