/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  invalidate: vi.fn(),
  config: { cameraId: "cimulu", modelId: "model_yolo", isEnabled: false, confidenceThreshold: 35, virtualLines: [] as Array<{ id: string; name: string; start: { x: number; y: number }; end: { x: number; y: number }; direction: "both"; enabled: boolean }>, classFilter: ["car", "truck", "bus", "motorcycle"] },
  models: [{ id: "model_yolo", name: "YOLO Kendaraan", framework: "yolo", fileName: "traffic.pt", sizeBytes: 2048, status: "ready", scope: "global" as const, cameraId: null }],
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import CountingWorkspace from "./CountingWorkspace";

describe("CountingWorkspace", () => {
  afterEach(() => {
    cleanup();
    mocks.loading = false;
    mocks.error = null;
    mocks.config.virtualLines = [];
    vi.restoreAllMocks();
  });

  it("menunjukkan state memuat dan error yang jelas sebelum konfigurasi tersedia", () => {
    mocks.loading = true;
    const { rerender } = render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay" isConsoleActive={false} onOpenConsole={vi.fn()} />);
    expect(screen.getByText(/Memuat konfigurasi counting/)).toBeTruthy();
    mocks.loading = false;
    mocks.error = new Error("network");
    rerender(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay" isConsoleActive={false} onOpenConsole={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toContain("Konfigurasi counting belum dapat dimuat");
    mocks.error = null;
  });

  it("mengarahkan operator untuk membuka konsol saat live video belum aktif", () => {
    const onOpenConsole = vi.fn();
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay" isConsoleActive={false} onOpenConsole={onOpenConsole} />);
    fireEvent.click(screen.getByRole("button", { name: /Buka konsol kamera untuk edit di live video/ }));
    expect(onOpenConsole).toHaveBeenCalledTimes(1);
  });

  it("tidak mengaktifkan mode edit sebelum slot live video benar-benar tersedia", () => {
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="slot-belum-ada" isConsoleActive onOpenConsole={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Edit garis langsung di live video/ }));
    expect(screen.queryByLabelText(/Overlay editor garis virtual pada live video/)).toBeNull();
  });

  it("menyimpan garis virtual yang dibuat langsung pada overlay live video untuk kamera yang dipilih", async () => {
    const portal = document.createElement("div");
    portal.id = "overlay";
    document.body.appendChild(portal);
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay" isConsoleActive onOpenConsole={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/YOLO Kendaraan/)).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /Edit garis langsung di live video/ }));
    const canvas = await screen.findByLabelText(/Bidang tambah garis pada live video/);
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
    portal.remove();
  });

  it("memuat kembali garis tersimpan pada overlay live video kamera", async () => {
    mocks.config.virtualLines = [{
      id: "line_cimulu_1",
      name: "Arah masuk",
      start: { x: 0.18, y: 0.45 },
      end: { x: 0.82, y: 0.52 },
      direction: "both",
      enabled: true,
    }];
    const portal = document.createElement("div");
    portal.id = "overlay-reload";
    document.body.appendChild(portal);

    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay-reload" isConsoleActive onOpenConsole={vi.fn()} />);

    await waitFor(() => expect(portal.querySelector("line")).toBeTruthy());
    expect(screen.getByText("Arah masuk")).toBeTruthy();
    portal.remove();
  });

  it("memilih garis pada overlay live lalu menyorot kartu detail garis yang sama", async () => {
    mocks.config.virtualLines = [{
      id: "line_cimulu_selected",
      name: "Arah keluar",
      start: { x: 0.2, y: 0.35 },
      end: { x: 0.74, y: 0.6 },
      direction: "both",
      enabled: true,
    }];
    const portal = document.createElement("div");
    portal.id = "overlay-select";
    document.body.appendChild(portal);
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay-select" isConsoleActive onOpenConsole={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Pilih garis Arah keluar" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Pilih garis Arah keluar" }));

    expect(screen.getByRole("button", { name: "Pilih garis Arah keluar" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Dipilih di overlay live")).toBeTruthy();
    portal.remove();
  });

  it("mengunggah model khusus kamera dengan metadata cakupan yang benar", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ model: { id: "model_cimulu" } }) } as Response);
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay" isConsoleActive={false} onOpenConsole={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/YOLOv8 kendaraan/), { target: { value: "YOLO Cimulu" } });
    fireEvent.change(screen.getByLabelText("Berkas model"), { target: { files: [new File(["weights"], "cimulu.onnx", { type: "application/octet-stream" })] } });
    fireEvent.click(screen.getByRole("button", { name: /Khusus kamera/ }));
    expect(screen.getByRole("button", { name: /Khusus kamera/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Unggah model khusus kamera/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(options).toEqual(expect.objectContaining({ headers: expect.objectContaining({ "x-model-scope": "camera", "x-model-camera-id": "cimulu" }) }));
    expect(mocks.invalidate).toHaveBeenCalledWith({ cameraId: "cimulu" });
  });

  it("merender garis normal dengan ketebalan ringan agar video tetap terlihat", async () => {
    mocks.config.virtualLines = [{ id: "line_thin", name: "Tipis", start: { x: 0.1, y: 0.3 }, end: { x: 0.9, y: 0.7 }, direction: "both", enabled: true }];
    const portal = document.createElement("div");
    portal.id = "overlay-thin";
    document.body.appendChild(portal);
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay-thin" isConsoleActive onOpenConsole={vi.fn()} />);

    await waitFor(() => expect(portal.querySelector('line[stroke="#bef264"]')).toBeTruthy());
    expect(portal.querySelector('line[stroke="#bef264"]')?.getAttribute("stroke-width")).toBe("2");
    portal.remove();
  });

  it("memindahkan titik ujung garis langsung pada overlay live lalu menyimpan geometri baru", async () => {
    mocks.config.virtualLines = [{ id: "line_drag", name: "Jalur masuk", start: { x: 0.2, y: 0.3 }, end: { x: 0.8, y: 0.6 }, direction: "both", enabled: true }];
    const portal = document.createElement("div");
    portal.id = "overlay-drag";
    document.body.appendChild(portal);
    render(<CountingWorkspace camera={{ id: "cimulu", name: "Simpang Cimulu" }} overlayTargetId="overlay-drag" isConsoleActive onOpenConsole={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Pilih garis Jalur masuk" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Pilih garis Jalur masuk" }));
    fireEvent.click(screen.getByRole("button", { name: /Edit garis langsung di live video/ }));
    const overlay = screen.getByLabelText(/Overlay editor garis virtual pada live video/);
    Object.defineProperty(overlay, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 1000, height: 562 }) });
    fireEvent.pointerDown(screen.getByLabelText("Pindahkan titik awal Jalur masuk"), { pointerId: 1, clientX: 200, clientY: 170 });
    fireEvent.pointerMove(overlay, { pointerId: 1, clientX: 420, clientY: 250 });
    fireEvent.pointerUp(overlay, { pointerId: 1 });
    fireEvent.click(screen.getByRole("button", { name: /Simpan konfigurasi kamera/ }));

    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ virtualLines: [expect.objectContaining({ id: "line_drag", start: { x: 0.42, y: expect.any(Number) } })] }));
    portal.remove();
  });
});
