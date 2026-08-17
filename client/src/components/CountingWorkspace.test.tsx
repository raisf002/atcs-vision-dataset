/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  invalidate: vi.fn(),
  config: { cameraId: "cimulu", modelId: "model_yolo", isEnabled: false, confidenceThreshold: 35, virtualLines: [], classFilter: ["car", "truck", "bus", "motorcycle"] },
  models: [{ id: "model_yolo", name: "YOLO Kendaraan", framework: "yolo", fileName: "traffic.pt", sizeBytes: 2048, status: "ready" }],
  loading: false,
  error: null as Error | null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ dataset: { countingConfig: { invalidate: mocks.invalidate }, visionModels: { invalidate: mocks.invalidate } } }),
    dataset: {
      countingConfig: { useQuery: () => ({ data: mocks.config, isLoading: mocks.loading, error: mocks.error, refetch: vi.fn() }) },
      visionModels: { useQuery: () => ({ data: mocks.models, isLoading: mocks.loading, error: mocks.error, refetch: vi.fn() }) },
      saveCountingConfig: { useMutation: () => ({ mutate: mocks.save, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CountingWorkspace from "./CountingWorkspace";

describe("CountingWorkspace", () => {
  it("menunjukkan state memuat dan error yang jelas sebelum konfigurasi tersedia", () => {
    mocks.loading = true;
    const { rerender } = render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} />);
    expect(screen.getByText(/Memuat konfigurasi counting/)).toBeTruthy();
    mocks.loading = false;
    mocks.error = new Error("network");
    rerender(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} />);
    expect(screen.getByRole("alert").textContent).toContain("Konfigurasi counting belum dapat dimuat");
    mocks.error = null;
  });

  it("menyimpan garis virtual dan model khusus untuk kamera yang dipilih", async () => {
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} />);
    await waitFor(() => expect(screen.getByText(/YOLO Kendaraan/)).toBeTruthy());

    const canvas = screen.getByLabelText(/Bidang anotasi garis virtual/);
    Object.defineProperty(canvas, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 1000, height: 562 }) });
    fireEvent.click(canvas, { clientX: 100, clientY: 200 });
    fireEvent.click(canvas, { clientX: 800, clientY: 350 });

    expect(screen.getByDisplayValue("Garis hitung baru")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Simpan konfigurasi kamera/ }));
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      cameraId: "cimulu",
      modelId: "model_yolo",
      virtualLines: [expect.objectContaining({ start: { x: 0.1, y: expect.any(Number) }, end: { x: 0.8, y: expect.any(Number) } })],
    }));
  });
});
