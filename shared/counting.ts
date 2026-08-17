export type NormalizedPoint = {
  x: number;
  y: number;
};

export type CountingDirection = "both" | "a_to_b" | "b_to_a";

export type VirtualCountingLine = {
  id: string;
  name: string;
  start: NormalizedPoint;
  end: NormalizedPoint;
  direction: CountingDirection;
  enabled: boolean;
};

export const DEFAULT_CLASS_FILTER = ["car", "truck", "bus", "motorcycle"];

export function createDefaultCountingConfig(cameraId: string) {
  return {
    cameraId,
    modelId: null as string | null,
    isEnabled: false,
    confidenceThreshold: 35,
    virtualLines: [] as VirtualCountingLine[],
    classFilter: [...DEFAULT_CLASS_FILTER],
  };
}
