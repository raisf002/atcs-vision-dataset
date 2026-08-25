/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  overview: {
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      cameras: [
        { id: "success", name: "Successful source", zone: "city", sourceStatus: "verified", lastCaptureStatus: "success", lastError: null, captureCount: 1 },
        { id: "hls", name: "HLS source", zone: "city", sourceStatus: "verified", lastCaptureStatus: "failed", lastError: "Error when loading first segment .ts", captureCount: 0 },
        { id: "pipeline", name: "Pipeline source", zone: "national", sourceStatus: "verified", lastCaptureStatus: "failed", lastError: "worker timeout while uploading snapshot", captureCount: 0 },
      ],
      totals: { snapshots: 0, storageBytes: 0, verifiedSources: 2, activeCameras: 2 },
      settings: { isEnabled: false, intervalMinutes: "5" },
      errors: [],
    },
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      overview: { useQuery: () => mocks.overview },
      dailyStats: { useQuery: () => ({ data: [], isLoading: false, isError: false }) },
      cameraStats: { useQuery: () => ({ data: [], isLoading: false, isError: false }) },
      availability: { useQuery: () => ({ data: [{ cameraId: "hls", successfulCaptures: 0, hlsTransientFailures: 1, pipelineFailures: 0, attempts: 1, availabilityPercent: 0, coverageStatus: "degraded" }], isLoading: false, isError: false }) },
      trainingReadiness: { useQuery: () => ({ data: { totalSnapshots: 0, approvedAnnotations: 0, pendingAnnotations: 0, invalidAnnotations: 0, classMap: ["car"] }, isLoading: false, isError: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));

import Home from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Dashboard registry status", () => {
  it("renders source HLS and pipeline failure labels from the latest capture result", () => {
    render(<Home />);

    expect(screen.getByText("Sumber HLS gagal")).toBeTruthy();
    expect(screen.getByText("Pipeline worker gagal")).toBeTruthy();
    expect(screen.getAllByText("Sumber bermasalah")).toHaveLength(2);
    expect(screen.getAllByText("Terkonfigurasi").length).toBeGreaterThan(0);
  });
});
