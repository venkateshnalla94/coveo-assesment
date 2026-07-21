"use client";

import { buildInteractiveResult, type Result, type SearchEngine } from "@coveo/headless";
import { useMemo } from "react";

import {
  getMeta,
  getResultDateLabel,
  getResultTags,
  getResultTypeLabel,
  getThumbnail,
} from "@/components/search/results/result-fields";
import { ResultCard } from "@/components/search/results/ResultCard";

export function ResultItem({
  engine,
  onSelect,
  position,
  query,
  result,
}: {
  engine: SearchEngine;
  onSelect?: (result: Result, position: number, query: string) => void;
  position?: number;
  query?: string;
  result: Result;
}) {
  const interactiveResult = useMemo(
    () =>
      buildInteractiveResult(engine, {
        options: {
          result,
        },
      }),
    [engine, result],
  );

  const thumbnail = getThumbnail(result);
  const meta = getMeta(result);
  const excerpt = result.excerpt || result.firstSentences;
  const resultType = getResultTypeLabel(result);
  const resultDate = getResultDateLabel(result);
  const resultTags = getResultTags(result);

  return (
    <ResultCard
      clickUri={result.clickUri}
      dateLabel={resultDate}
      excerpt={excerpt}
      meta={meta}
      onSelect={() => {
        onSelect?.(result, position ?? 1, query ?? "");
        interactiveResult.select();
      }}
      printableUri={result.printableUri || result.uri}
      resultType={resultType}
      tags={resultTags}
      thumbnail={thumbnail}
      title={result.title}
    />
  );
}
