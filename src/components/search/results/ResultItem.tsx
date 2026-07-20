"use client";

/* eslint-disable @next/next/no-img-element */
import { buildInteractiveResult, type Result, type SearchEngine } from "@coveo/headless";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";

import { getMeta, getThumbnail } from "@/components/search/results/result-fields";

export function ResultItem({ engine, result }: { engine: SearchEngine; result: Result }) {
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

  return (
    <article className="result-item">
      {thumbnail ? <img alt="" className="result-thumbnail" loading="lazy" src={thumbnail} /> : null}

      <div className="result-body">
        <a
          className="result-title"
          href={result.clickUri}
          onClick={() => interactiveResult.select()}
          onContextMenu={() => interactiveResult.select()}
          onMouseDown={() => interactiveResult.select()}
          rel="noreferrer"
          target="_blank"
        >
          <span>{result.title}</span>
          <ExternalLink aria-hidden="true" size={16} />
        </a>

        {excerpt ? <p className="result-excerpt">{excerpt}</p> : null}

        <div className="result-footer">
          <span className="printable-uri">{result.printableUri || result.uri}</span>
          {meta.length > 0 ? <span className="result-meta">{meta.join(" / ")}</span> : null}
        </div>
      </div>
    </article>
  );
}
