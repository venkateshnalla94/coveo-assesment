import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchBox } from "@/components/search/SearchBox";

afterEach(() => {
  cleanup();
});

describe("SearchBox", () => {
  it("submits non-empty queries and clears input", async () => {
    const onClear = vi.fn();
    const onQueryChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <SearchBox
        isLoading={false}
        onClear={onClear}
        onQueryChange={onQueryChange}
        onSubmit={onSubmit}
        provider={{ getSuggestions: vi.fn().mockResolvedValue([]) }}
        query="digital"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onSubmit).toHaveBeenCalledWith("digital");
    expect(onClear).toHaveBeenCalled();
  });

  it("renders suggestions and supports keyboard selection", async () => {
    const onQueryChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <SearchBox
        isLoading={false}
        onClear={vi.fn()}
        onQueryChange={onQueryChange}
        onSubmit={onSubmit}
        provider={{
          getSuggestions: vi
            .fn()
            .mockResolvedValue([{ id: "s1", label: "Digital Strategy", value: "Digital Strategy" }]),
        }}
        query="dig"
      />,
    );

    const input = screen.getByRole("combobox", { name: "Search" });
    await userEvent.click(input);

    expect(await screen.findByRole("option", { name: "Digital Strategy" })).toBeTruthy();

    await userEvent.keyboard("[ArrowDown][Enter]");

    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalledWith("Digital Strategy");
      expect(onSubmit).toHaveBeenCalledWith("Digital Strategy");
    });
  });

  it("does not submit empty input", async () => {
    const onSubmit = vi.fn();

    render(
      <SearchBox
        isLoading={false}
        onClear={vi.fn()}
        onQueryChange={vi.fn()}
        onSubmit={onSubmit}
        provider={{ getSuggestions: vi.fn().mockResolvedValue([]) }}
        query=" "
      />,
    );

    expect(screen.getByRole("button", { name: "Search" }).getAttribute("disabled")).not.toBeNull();
    await userEvent.keyboard("[Enter]");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
