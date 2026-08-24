// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ loading: false, user: null, logout: vi.fn() }),
}));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@/pages/Home", () => ({ default: () => <p>Overview publik</p> }));

import App from "./App";

describe("fallback routing", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    window.history.replaceState({}, "", "/Lakukan%20evaluasi%20komprehensif?from_webdev=1");
  });

  it("mengalihkan URL tak dikenal kembali ke Overview", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Overview publik")).toBeTruthy();
    });
    expect(window.location.pathname).toBe("/");
  });
});
