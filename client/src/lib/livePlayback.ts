export const LIVE_PLAYBACK_MAX_AGE_MS = 15 * 60_000;
const STORAGE_KEY = "atcs-live-playback-success";
const CHANGE_EVENT = "atcs-live-playback-change";

type LivePlaybackRecords = Record<string, number>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRecords(): LivePlaybackRecords {
  if (!canUseStorage()) return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as LivePlaybackRecords;
    return Object.fromEntries(Object.entries(parsed).filter(([, observedAt]) => Number.isFinite(observedAt)));
  } catch {
    return {};
  }
}

export function getLivePlaybackRecords(now = Date.now()): LivePlaybackRecords {
  return Object.fromEntries(Object.entries(readRecords()).filter(([, observedAt]) => now - observedAt <= LIVE_PLAYBACK_MAX_AGE_MS));
}

export function recordLivePlayback(cameraId: string, observedAt = Date.now()) {
  if (!cameraId || !canUseStorage()) return;
  const records = { ...getLivePlaybackRecords(observedAt), [cameraId]: observedAt };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeLivePlayback(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function clearLivePlaybackRecords() {
  if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
}
