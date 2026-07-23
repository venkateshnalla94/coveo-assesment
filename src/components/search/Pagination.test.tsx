import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPageWindow, Pagination } from "@/components/search/Pagination";

describe("Pagination", () => {
  afterEach(() => {
    cleanup();
  });

  it("selects previous, next, and numbered pages with boundary states", async () => {
    const onSelectPage = vi.fn();

    render(
      <Pagination
        onSelectPage={onSelectPage}
        pagination={{
          currentPage: 2,
          firstResult: 5,
          lastResult: 8,
          pageSize: 4,
          totalCount: 10,
          totalPages: 3,
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Previous page" }));
    await userEvent.click(screen.getByRole("button", { name: "3" }));
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(onSelectPage).toHaveBeenNthCalledWith(1, 1);
    expect(onSelectPage).toHaveBeenNthCalledWith(2, 3);
    expect(onSelectPage).toHaveBeenNthCalledWith(3, 3);
    expect(screen.getByRole("button", { name: "2" }).getAttribute("aria-current")).toBe("page");
  });

  it("windows large page counts around the current page with ellipsis markers", () => {
    expect(getPageWindow(7, 52)).toEqual([1, "…", 6, 7, 8, "…", 52]);
    expect(getPageWindow(1, 52)).toEqual([1, 2, "…", 52]);
    expect(getPageWindow(52, 52)).toEqual([1, "…", 51, 52]);
    expect(getPageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("renders a bounded set of page buttons with ellipsis for a large page count", async () => {
    const onSelectPage = vi.fn();

    render(
      <Pagination
        onSelectPage={onSelectPage}
        pagination={{
          currentPage: 7,
          firstResult: 145,
          lastResult: 168,
          pageSize: 24,
          totalCount: 1242,
          totalPages: 52,
        }}
      />,
    );

    expect(screen.getAllByRole("button").length).toBeLessThan(10);
    expect(screen.getAllByText("…").length).toBe(2);

    await userEvent.click(screen.getByRole("button", { name: "52" }));
    expect(onSelectPage).toHaveBeenCalledWith(52);
  });
});
