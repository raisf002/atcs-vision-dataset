/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { type ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mutate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    dataset: {
      cameras: {
        useQuery: () => ({
          data: [{
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
          }],
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
});

describe("Camera registry interactions", () => {
  it("opens a camera detail route when the registry row is clicked", async () => {
    const user = userEvent.setup();
    render(<Cameras />);

    await user.click(screen.getByRole("link", { name: "Buka detail dan pengaturan Simpang Cimulu" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/cameras/cimulu");
  });

  it("keeps the capture toggle independent from the row navigation", async () => {
    const user = userEvent.setup();
    render(<Cameras />);

    await user.click(screen.getByRole("button", { name: "Nonaktifkan capture Simpang Cimulu" }));

    expect(mocks.mutate).toHaveBeenCalledWith({ id: "cimulu", isActive: false }, expect.any(Object));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
