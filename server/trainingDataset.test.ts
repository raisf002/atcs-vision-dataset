import { describe, expect, it } from "vitest";
import { buildTrainingPlan, createDatasetYaml, getDeterministicSplit, getImageArchivePath, getLabelArchivePath, inspectJpegQuality, validateYoloLabel } from "./trainingDataset";

describe("training dataset pipeline", () => {
  it("menentukan split stabil dan path images/labels berpasangan", () => {
    const snapshot = { id: 7, cameraId: "jati", storageKey: "jati/2026-08-19/frame.jpg", width: 704, height: 576, sizeBytes: 1200 };
    const split = getDeterministicSplit(snapshot.storageKey);
    expect(getDeterministicSplit(snapshot.storageKey)).toBe(split);
    expect(["train", "val", "test"]).toContain(split);
    expect(getImageArchivePath(snapshot, split)).toBe(`images/${split}/jati/frame.jpg`);
    expect(getLabelArchivePath(snapshot, split)).toBe(`labels/${split}/jati/frame.txt`);
  });

  it("menerima label YOLO normal dan menolak box atau class yang tidak valid", () => {
    expect(validateYoloLabel("0 0.5 0.5 0.2 0.2", 4)).toMatchObject({ valid: true, normalized: "0 0.5 0.5 0.2 0.2\n" });
    expect(validateYoloLabel("4 0.5 0.5 0.2 0.2", 4)).toMatchObject({ valid: false });
    expect(validateYoloLabel("0 1 0.5 0.4 0.2", 4)).toMatchObject({ valid: false });
  });

  it("hanya menyertakan anotasi approved yang lolos quality gate dan mengeluarkan duplikat", () => {
    const plan = buildTrainingPlan({
      snapshots: [
        { id: 1, cameraId: "jati", storageKey: "jati/2026-08-19/a.jpg", width: 704, height: 576, sizeBytes: 100 },
        { id: 2, cameraId: "jati", storageKey: "jati/2026-08-19/b.jpg", width: 704, height: 576, sizeBytes: 100 },
        { id: 3, cameraId: "cimulu", storageKey: "cimulu/2026-08-19/c.jpg", width: 704, height: 576, sizeBytes: 100 },
      ],
      annotations: [
        { snapshotId: 1, yoloText: "0 0.5 0.5 0.2 0.2", status: "approved" },
        { snapshotId: 2, yoloText: "0 0.5 0.5 0.2 0.2", status: "approved" },
      ],
      classMap: ["car", "truck", "bus", "motorcycle"],
      qualities: new Map([
        [1, { ok: true, fingerprint: "same", blurVariance: 60 }],
        [2, { ok: true, fingerprint: "same", blurVariance: 60 }],
        [3, { ok: false, fingerprint: "other", blurVariance: 0, reason: "unreadable" }],
      ]),
    });
    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]?.image).toMatch(/^images\/(train|val|test)\/jati\/a.jpg$/);
    expect(plan.entries[0]?.label).toMatch(/^labels\/(train|val|test)\/jati\/a.txt$/);
    expect(plan.quality).toMatchObject({ accepted: 1, duplicate: 1, unannotated: 1 });
    expect(plan.excluded).toEqual(expect.arrayContaining([{ snapshotId: 2, reason: "duplicate" }, { snapshotId: 3, reason: "label_belum_disetujui" }]));
  });

  it("melaporkan bytes yang bukan JPEG sebagai unreadable dan membuat dataset.yaml", () => {
    expect(inspectJpegQuality(Buffer.from("not a jpeg"))).toMatchObject({ ok: false, reason: "unreadable" });
    expect(createDatasetYaml(["car", "truck"])).toContain("0: \"car\"");
  });
});
