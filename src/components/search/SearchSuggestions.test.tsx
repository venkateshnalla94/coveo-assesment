import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SearchSuggestions } from "@/components/search/SearchSuggestions";

describe("SearchSuggestions", () => {
  it("renders loading, empty, and selectable suggestion states", async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <SearchSuggestions
        activeIndex={-1}
        id="suggestions"
        isLoading
        onSelect={onSelect}
        suggestions={[]}
      />,
    );

    expect(screen.getByText("Loading suggestions")).toBeTruthy();

    rerender(
      <SearchSuggestions
        activeIndex={-1}
        id="suggestions"
        isLoading={false}
        onSelect={onSelect}
        suggestions={[]}
      />,
    );

    expect(screen.queryByRole("listbox")).toBeNull();

    rerender(
      <SearchSuggestions
        activeIndex={0}
        id="suggestions"
        isLoading={false}
        onSelect={onSelect}
        suggestions={[{ id: "s1", label: "Digital", value: "digital" }]}
      />,
    );

    await userEvent.click(screen.getByRole("option", { name: "Digital" }));

    expect(screen.getByRole("option").getAttribute("aria-selected")).toBe("true");
    expect(onSelect).toHaveBeenCalledWith({ id: "s1", label: "Digital", value: "digital" });
  });
});
