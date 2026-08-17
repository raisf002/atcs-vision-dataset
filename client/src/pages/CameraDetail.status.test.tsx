/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import userEvent from "@testing-library/user-event";

const defaultCamera = {
  id: "cimulu",
  name: "Simpang Cimulu",
  zone: "city",
  sourceUrl: "https://example.test/live.m3u8",
  isActive: true,
  captureIntervalMinutes: "5",
  captureCount: 0,
  lastCaptureAt: null,
  sourceStatus: "verified",
  lastCaptureStatus: "failed",
  lastError: "Error when loading first segment .ts" as string | null,
};

const mocks = vi.hoisted(() => ({
  camera: null as typeof defaultCamera | null,
  mutate: vi.fn(),
}));
mocks.camera = defaultCamera;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      cameras: { useQuery: () => ({ data: mocks.camera ? [mocks.camera] : [], isLoading: false, refetch: vi.fn() }) },
      updateCamera: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    },
  },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/components/LiveHlsPlayer", () => ({ default: ({ cameraName, onPlaybackStatusChange }: { cameraName: string; onPlaybackStatusChange?: (status: "playing") => void }) => <button type="button" onClick={() => onPlaybackStatusChange?.("playing")}>Simulasikan live {cameraName}</button> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a>,
  useRoute: () => [true, { cameraId: "cimulu" }],
}));

import CameraDetail from "./CameraDetail";

afterEach(() => {
  cleanup();
  mocks.camera = defaultCamera;
  vi.clearAllMocks();
});

describe("Camera detail failure diagnostics", () => {
  it("offers a live-view retry when the HLS source fails", () => {
    render(<CameraDetail />);

    expect(screen.getByText("Sumber HLS gagal")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Muat ulang live view" })).toBeTruthy();
  });

  it("shows the live source as available when playback succeeds despite an earlier capture failure", async () => {
    const user = userEvent.setup();
    render(<CameraDetail />);

    await user.click(screen.getByRole("button", { name: "Simulasikan live Simpang Cimulu" }));

    expect(screen.getByText("Live view tersedia sekarang")).toBeTruthy();
    expect(screen.getByText(/Stream HLS berhasil diputar di peramban ini/)).toBeTruthy();
    expect(screen.getByText(/Riwayat capture sebelumnya: sumber hls gagal/)).toBeTruthy();
    expect(screen.queryByText("Sumber HLS gagal")).toBeNull();
  });

  it("treats exhausted HLS segment retries as a temporary source disruption", () => {
    mocks.camera = { ...defaultCamera, lastError: "HLS_TRANSIENT: segmen live tidak tersedia atau tidak valid setelah 4 percobaan." };
    render(<CameraDetail />);

    expect(screen.getByText("Gangguan HLS sementara")).toBeTruthy();
    expect(screen.getByText(/Tidak perlu mengubah URL saat gangguan bersifat sementara/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Muat ulang live view" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Tinjau registry" })).toBeNull();
  });

  it("directs worker failures to the registry instead of presenting them as source failures", () => {
    mocks.camera = { ...defaultCamera, lastError: "worker timeout while uploading snapshot" };
    render(<CameraDetail />);

    expect(screen.getByText("Pipeline worker gagal")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tinjau registry" }).getAttribute("href")).toBe("/cameras");
  });

  it("does not show recovery alerts for a successful latest capture", () => {
    mocks.camera = { ...defaultCamera, lastCaptureStatus: "success", lastError: null, captureCount: 1 };
    render(<CameraDetail />);

    expect(screen.queryByText("Sumber HLS gagal")).toBeNull();
    expect(screen.queryByText("Pipeline worker gagal")).toBeNull();
  });
});
