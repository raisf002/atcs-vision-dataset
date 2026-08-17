/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  cameras: [
    {
      id: "alpha",
      name: "Simpang Alpha",
      sourceUrl: "https://example.test/alpha.m3u8",
      sourceStatus: "verified" as const,
      lastCaptureStatus: "success" as const,
      lastCaptureAt: null,
      lastError: null,
      captureIntervalMinutes: "5",
      captureCount: 7,
    },
    {
      id: "beta",
      name: "Simpang Beta",
      sourceUrl: "https://example.test/beta.m3u8",
      sourceStatus: "verified" as const,
      lastCaptureStatus: "failed" as const,
      lastCaptureAt: null,
      lastError: "Error when loading first segment .ts",
      captureIntervalMinutes: "10",
      captureCount: 0,
    },
  ],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { dataset: { cameras: { useQuery: () => ({ data: mocks.cameras, refetch: mocks.refetch }) } } },
}));
vi.mock("@/components/LiveHlsPlayer", () => ({ default: ({ cameraName }: { cameraName: string }) => <div data-testid="live-player">Live view {cameraName}</div> }));
vi.mock("@/components/AtcsCoordinateMap", () => ({ default: ({ cameras, onSelect }: { cameras: Array<{ id: string; name: string }>; onSelect: (id: string) => void }) => <div data-testid="coordinate-map">{cameras.map((camera) => <button key={camera.id} aria-label={`Pilih ${camera.name}`} onClick={() => onSelect(camera.id)}>{camera.name}</button>)}</div> }));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));

import CommandCenter from "./CommandCenter";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommandCenter", () => {
  it("memilih titik registry lalu membuka konsol live kamera yang dipilih", async () => {
    const user = userEvent.setup();
    render(<CommandCenter />);

    await user.click(screen.getByLabelText("Pilih Simpang Beta"));

    expect(screen.getByTestId("live-player").textContent).toContain("Simpang Beta");
    expect(screen.getByText("Sumber HLS gagal")).toBeTruthy();
  });

  it("menjaga kontrol AI sebagai konfigurasi preview yang dapat ditoggle", async () => {
    const user = userEvent.setup();
    render(<CommandCenter />);

    expect(screen.getByText("PREVIEW")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Konsol kamera/ }));
    const aiToggle = screen.getByText(/AI deteksi:/).closest("button");
    expect(aiToggle).toBeTruthy();
    await user.click(aiToggle!);

    expect(screen.getByText(/AI deteksi: AKTIF \(preview\)/)).toBeTruthy();
    expect(screen.getByText(/Inferensi produksi membutuhkan model, worker, dan persetujuan deployment/)).toBeTruthy();
  });

  it("labels failed captures as historical records rather than current live-source failures", () => {
    render(<CommandCenter />);

    expect(screen.getAllByText("Riwayat capture gagal").length).toBeGreaterThan(0);
    expect(screen.getByText("bukan status live saat ini")).toBeTruthy();
    expect(screen.getByText(/Indikator oranye mencatat hasil percobaan capture terakhir/)).toBeTruthy();
    expect(screen.queryByText("Sumber/pipeline gagal")).toBeNull();
  });
});
