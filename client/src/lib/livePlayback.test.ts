/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { clearLivePlaybackRecords, getLivePlaybackRecords, LIVE_PLAYBACK_MAX_AGE_MS, recordLivePlayback } from "./livePlayback";

afterEach(() => clearLivePlaybackRecords());

describe("live playback records", () => {
  it("retains a recent successful playback and excludes stale records", () => {
    const now = 1_000_000;
    recordLivePlayback("cimulu", now);

    expect(getLivePlaybackRecords(now)["cimulu"]).toBe(now);
    expect(getLivePlaybackRecords(now + LIVE_PLAYBACK_MAX_AGE_MS + 1)["cimulu"]).toBeUndefined();
  });
});
