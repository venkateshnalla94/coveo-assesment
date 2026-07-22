import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HighlightedText } from "@/components/commerce/HighlightedText";

describe("HighlightedText", () => {
  it("renders plain text when there are no highlights", () => {
    const { container } = render(<HighlightedText text="TIG Welding Torch" />);

    expect(container.textContent).toBe("TIG Welding Torch");
    expect(container.querySelector("mark")).toBeNull();
  });

  it("wraps the highlighted ranges in <mark> and preserves surrounding text", () => {
    const { container } = render(
      <HighlightedText
        highlights={[{ length: 7, offset: 4 }]}
        text="TIG Welding Torch"
      />,
    );

    const mark = container.querySelector("mark");
    expect(mark?.textContent).toBe("Welding");
    expect(container.textContent).toBe("TIG Welding Torch");
  });

  it("sorts out-of-order highlight ranges before rendering", () => {
    const { container } = render(
      <HighlightedText
        highlights={[
          { length: 5, offset: 26 },
          { length: 5, offset: 0 },
        ]}
        text="Robot arm compatible with joint J6"
      />,
    );

    const marks = Array.from(container.querySelectorAll("mark"));
    expect(marks.map((mark) => mark.textContent)).toEqual(["Robot", "joint"]);
  });

  it("clamps overlapping highlight ranges instead of duplicating text", () => {
    const { container } = render(
      <HighlightedText
        highlights={[
          { length: 5, offset: 0 },
          { length: 5, offset: 3 },
        ]}
        text="Robot arm"
      />,
    );

    expect(container.textContent).toBe("Robot arm");
    const marks = Array.from(container.querySelectorAll("mark"));
    expect(marks.map((mark) => mark.textContent)).toEqual(["Robot", " ar"]);
  });
});
