// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EARTH_TILE_URL } from "@/lib/earthBasemap";

const markerState: { click?: () => void; popup: ReturnType<typeof vi.fn> } = { popup: vi.fn() };
const mapInstance = { setView: vi.fn(), fitBounds: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn() };
const markerLayer: { addTo: ReturnType<typeof vi.fn>; clearLayers: ReturnType<typeof vi.fn> } = {
  addTo: vi.fn(),
  clearLayers: vi.fn(),
};
markerLayer.addTo.mockReturnValue(markerLayer);
const marker = {
  bindTooltip: vi.fn(),
  bindPopup: markerState.popup,
  on: vi.fn((event: string, handler: () => void) => { if (event === "click") markerState.click = handler; }),
  addTo: vi.fn(),
};

vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => mapInstance),
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => markerLayer),
    circleMarker: vi.fn(() => marker),
    latLngBounds: vi.fn(() => ({ extend: vi.fn(), pad: vi.fn(() => ({})) })),
  },
}));

import L from "leaflet";
import AtcsCoordinateMap from "./AtcsCoordinateMap";

describe("AtcsCoordinateMap", () => {
  it("uses Earth tiles and routes a real marker click to the selected camera", () => {
    const onSelect = vi.fn();
    render(<AtcsCoordinateMap cameras={[{ id: "cimulu", name: "Simpang Cimulu", lastCaptureStatus: "success" }]} onSelect={onSelect} />);

    expect(L.tileLayer).toHaveBeenCalledWith(EARTH_TILE_URL, expect.objectContaining({ attribution: expect.stringContaining("Esri") }));
    expect(marker.bindPopup).toHaveBeenCalledWith(expect.stringContaining("-7.321100, 108.221297"));
    act(() => markerState.click?.());
    expect(onSelect).toHaveBeenCalledWith("cimulu");
  });
});
