// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ loading: false, user: null, logout: vi.fn() }) }));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));

import DashboardLayout from "./DashboardLayout";

describe("DashboardLayout Guest", () => {
  it("menampilkan workspace baca publik dengan identitas Guest tanpa memaksa login", () => {
    render(<DashboardLayout><p>Konten publik</p></DashboardLayout>);
    expect(screen.getByText("Konten publik")).toBeTruthy();
    expect(screen.getByText("Guest")).toBeTruthy();
    expect(screen.getByText("Mode baca publik")).toBeTruthy();
    expect(screen.getByText("Guest · lihat saja")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Masuk sebagai admin" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ringkasan" }).getAttribute("aria-current")).toBe("page");
  });
});
