import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/search/Pagination";

describe("Pagination", () => {
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
});
