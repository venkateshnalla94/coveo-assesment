import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DomainFacetPanel } from "@/components/search/facets/DomainFacetPanel";

describe("DomainFacetPanel", () => {
  it("toggles values and clears filters", async () => {
    const onClearAll = vi.fn();
    const onClearFacet = vi.fn();
    const onToggleValue = vi.fn();

    render(
      <DomainFacetPanel
        facets={[
          {
            field: "filetype",
            id: "filetype",
            label: "Content Type",
            values: [
              { count: 10, label: "All", selected: false, value: "All" },
              { count: 4, label: "PDF", selected: true, value: "PDF" },
            ],
          },
        ]}
        onClearAll={onClearAll}
        onClearFacet={onClearFacet}
        onToggleValue={onToggleValue}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "PDF 4" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(onToggleValue).toHaveBeenCalledWith("filetype", "PDF");
    expect(onClearFacet).toHaveBeenCalledWith("filetype");
    expect(onClearAll).toHaveBeenCalled();
  });
});
