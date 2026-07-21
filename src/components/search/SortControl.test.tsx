import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SortControl } from "@/components/search/SortControl";

describe("SortControl", () => {
  it("calls onChange with selected sort", async () => {
    const onChange = vi.fn();

    render(<SortControl onChange={onChange} value="relevance" />);

    await userEvent.selectOptions(screen.getByLabelText("Sort results"), "newest");

    expect(onChange).toHaveBeenCalledWith("newest");
  });
});
