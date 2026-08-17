/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
  refetch: vi.fn(),
  cameras: [{
    id: "cimulu",
    name: "Simpang Cimulu",
    sortOrder: 1,
    zone: "city",
    sourceStatus: "verified",
    sourceUrl: "https://example.test/cimulu.m3u8",
    isActive: true,
    lastCaptureStatus: "success",
    lastCaptureAt: null,
    captureIntervalMinutes: "5",
    lastError: null as string | null,
  }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      cameras: {
        useQuery: () => ({
          data: mocks.cameras,
          isLoading: false,
          refetch: mocks.refetch,
        }),
      },
      updateCamera: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/cameras", mocks.navigate],
}));

import Cameras from "./Cameras";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.cameras = [{
    ...mocks.cameras[0],
    id: "cimulu",
    name: "Simpang Cimulu",
    sourceStatus: "verified",
    lastCaptureStatus: "success",
    lastError: null,
  }];
});

describe("Camera registry interactions", () => {
  it("opens a camera detail route when the registry row is clicked", async () => {
    const user = userEvent.setup();
    render(<Cameras />);

    await user.click(screen.getByRole("link", { name: "Buka detail dan pengaturan Simpang Cimulu" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/cameras/cimulu");
  });

  it("renders different explanations for source, pending, and pipeline failures", () => {
    mocks.cameras = [
      { ...mocks.cameras[0], id: "hls-failed", name: "HLS Failed", lastCaptureStatus: "failed", lastError: "Error when loading first segment .ts" },
      { ...mocks.cameras[0], id: "not-tested", name: "Not Tested", sourceStatus: "pending", lastCaptureStatus: "pending", lastError: null },
      { ...mocks.cameras[0], id: "pipeline-failed", name: "Pipeline Failed", lastCaptureStatus: "failed", lastError: "worker timeout while uploading snapshot" },
    ];
    render(<Cameras />);

    expect(screen.getByText("Sumber HLS gagal")).toBeTruthy();
    expect(screen.getByText("URL HLS belum diuji oleh worker.")).toBeTruthy();
    expect(screen.getByText("Pipeline worker gagal")).toBeTruthy();
  });

  it("renders exhausted HLS segment retries as a temporary disruption", () => {
    mocks.cameras = [{
      ...mocks.cameras[0],
      id: "hls-transient",
      name: "HLS Transient",
      lastCaptureStatus: "failed",
      lastError: "HLS_TRANSIENT: segmen live tidak tersedia atau tidak valid setelah 4 percobaan.",
    }];
    render(<Cameras />);

    expect(screen.getByText("Gangguan HLS sementara")).toBeTruthy();
    expect(screen.getByText(/Worker akan mencoba ulang secara otomatis/)).toBeTruthy();
  });

  it("filters the registry by capture health without hiding the source diagnosis", async () => {
    const user = userEvent.setup();
    mocks.cameras = [
      { ...mocks.cameras[0], id: "healthy", name: "Healthy", lastCaptureStatus: "success", lastError: null },
      { ...mocks.cameras[0], id: "hls-failed", name: "HLS Failed", lastCaptureStatus: "failed", lastError: "Error when loading first segment .ts" },
      { ...mocks.cameras[0], id: "pipeline-failed", name: "Pipeline Failed", lastCaptureStatus: "failed", lastError: "worker timeout while uploading snapshot" },
      { ...mocks.cameras[0], id: "pending", name: "Pending", lastCaptureStatus: "pending", lastError: null },
      { ...mocks.cameras[0], id: "disabled", name: "Disabled", lastCaptureStatus: "disabled", lastError: null },
    ];
    render(<Cameras />);

    await user.click(screen.getByRole("button", { name: /HLS gagal: 1 kamera/ }));

    expect(screen.getByText("HLS Failed")).toBeTruthy();
    expect(screen.getByText("Sumber HLS gagal")).toBeTruthy();
    expect(screen.queryByText("Healthy")).toBeNull();
    expect(screen.queryByText("Pipeline Failed")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Menunggu: 1 kamera/ }));
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.queryByText("Disabled")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Nonaktif: 1 kamera/ }));
    expect(screen.getByText("Disabled")).toBeTruthy();
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("keeps the capture toggle independent from the row navigation", async () => {
    const user = userEvent.setup();
    render(<Cameras />);

    await user.click(screen.getByRole("button", { name: "Nonaktifkan capture Simpang Cimulu" }));

    expect(mocks.mutate).toHaveBeenCalledWith({ id: "cimulu", isActive: false }, expect.any(Object));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
