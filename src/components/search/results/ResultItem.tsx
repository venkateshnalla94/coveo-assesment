"use client";

/* eslint-disable @next/next/no-img-element */
import { buildInteractiveResult, type Result, type SearchEngine } from "@coveo/headless";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";

type RawValue = string | number | boolean | string[] | number[] | null | undefined;

function getRawString(result: Result, keys: string[]) {
  for (const key of keys) {
    const value = result.raw[key] as RawValue;

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0];
    }
  }

  return undefined;
}

function getThumbnail(result: Result) {
  return getRawString(result, ["thumbnailuri", "thumbnail", "image", "imageurl"]);
}

function getMeta(result: Result) {
  return [
    getRawString(result, ["source"]),
    getRawString(result, ["filetype", "documenttype"]),
    getRawString(result, ["author"]),
  ].filter(Boolean);
}

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
