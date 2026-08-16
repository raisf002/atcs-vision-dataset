/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";

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
vi.mock("@/components/LiveHlsPlayer", () => ({ default: ({ cameraName }: { cameraName: string }) => <div data-testid="live-player">Live {cameraName}</div> }));
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
