import type { ReactNode } from "react";

import type { ProductTextHighlight } from "@/features/commerce/models/commerce-models";

export function HighlightedText({
  highlights,
  text,
}: {
  highlights?: ProductTextHighlight[];
  text: string;
}) {
  if (!highlights || highlights.length === 0) {
    return <>{text}</>;
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.offset - b.offset);
  const segments: ReactNode[] = [];
  let cursor = 0;

  sortedHighlights.forEach((highlight, index) => {
    const start = Math.max(highlight.offset, cursor);
    const end = Math.min(highlight.offset + highlight.length, text.length);

    if (start >= end) {
      return;
    }

    if (start > cursor) {
      segments.push(text.slice(cursor, start));
    }

    segments.push(<mark key={`${start}-${end}-${index}`}>{text.slice(start, end)}</mark>);
    cursor = end;
  });

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}
