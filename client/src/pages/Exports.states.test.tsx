/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";

const mocks = vi.hoisted(() => ({
  snapshotState: { isLoading: false, isError: false, data: [] as Array<unknown>, refetch: vi.fn() },
  readinessState: { isLoading: false, isError: false, data: { totalSnapshots: 0, approvedAnnotations: 0, pendingAnnotations: 0, invalidAnnotations: 0, classMap: ["car"] }, refetch: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      cameras: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      snapshots: { useQuery: () => mocks.snapshotState },
      trainingReadiness: { useQuery: () => mocks.readinessState },
    },
  },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin", name: "Admin" } }) }));

import Exports from "./Exports";

afterEach(() => {
  cleanup();
  mocks.snapshotState = { isLoading: false, isError: false, data: [], refetch: vi.fn() };
  mocks.readinessState = { isLoading: false, isError: false, data: { totalSnapshots: 0, approvedAnnotations: 0, pendingAnnotations: 0, invalidAnnotations: 0, classMap: ["car"] }, refetch: vi.fn() };
});

describe("Dataset export states", () => {
  it("explains an empty export preview and disables the download", () => {
    render(<Exports />);

    expect(screen.getByText("Belum ada snapshot yang sesuai; pilih rentang lain atau jalankan capture terlebih dahulu.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Unduh arsip JPEG mentah" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not present a metadata error as an empty export", () => {
    mocks.snapshotState = { isLoading: false, isError: true, data: [], refetch: vi.fn() };
    render(<Exports />);

    expect(screen.getByText("Pratinjau tidak dapat dimuat; data tidak diasumsikan kosong.")).toBeTruthy();
  });
});
