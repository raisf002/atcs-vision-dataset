/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";

const mocks = vi.hoisted(() => ({
  galleryState: { isLoading: false, isError: false, data: [] as Array<unknown>, refetch: vi.fn() },
  exportState: { isLoading: false, isError: false, data: [] as Array<unknown>, refetch: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      cameras: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      snapshots: { useQuery: () => mocks.galleryState },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

import DatasetGallery from "./DatasetGallery";

afterEach(() => {
  cleanup();
  mocks.galleryState = { isLoading: false, isError: false, data: [], refetch: vi.fn() };
  mocks.exportState = { isLoading: false, isError: false, data: [], refetch: vi.fn() };
});

describe("Dataset gallery delivery states", () => {
  it("gives an actionable explanation for an empty gallery", () => {
    render(<DatasetGallery />);

    expect(screen.getByText("Belum ada snapshot untuk filter ini")).toBeTruthy();
    expect(screen.getByText(/Pilih kamera atau tanggal lain, atau jalankan capture/)).toBeTruthy();
    expect(screen.getByText("Belum ada objek snapshot untuk filter ini.")).toBeTruthy();
  });

  it("does not represent a metadata error as an empty gallery", () => {
    mocks.galleryState = { isLoading: false, isError: true, data: [], refetch: vi.fn() };
    render(<DatasetGallery />);

    expect(screen.getByText("Galeri belum dapat dimuat")).toBeTruthy();
    expect(screen.getByText("Metadata snapshot belum dapat dimuat; dataset tidak diasumsikan kosong.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba muat ulang" })).toBeTruthy();
  });
});
