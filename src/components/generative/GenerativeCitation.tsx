"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { useAnalytics } from "@/features/analytics/analytics";
import type { GenerativeCitation as GenerativeCitationModel } from "@/features/generative/models/generative-models";
import { getSafeCitationUrl } from "@/features/generative/services/citations";

const EXCERPT_SENTENCE_PREVIEW_COUNT = 4;
const EXCERPT_MAX_LENGTH = 320;

// Citation excerpts can come back as long ML-highlighted passages; cap to a short
// preview so the citation list stays scannable rather than turning into more reading.
function getExcerptPreview(excerpt: string | undefined) {
  if (!excerpt) {
    return undefined;
  }

  const trimmed = excerpt.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)/g);
  const preview = sentences?.slice(0, EXCERPT_SENTENCE_PREVIEW_COUNT).join("").trim();
  const candidate = preview && preview.length < trimmed.length ? `${preview}...` : (preview ?? trimmed);

  if (candidate.length <= EXCERPT_MAX_LENGTH) {
    return candidate;
  }

  return `${candidate.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}...`;
}

export function GenerativeCitation({
  citation,
  index,
  query,
}: {
  citation: GenerativeCitationModel;
  index: number;
  query: string;
}) {
  const analytics = useAnalytics();
  const externalHref = getSafeCitationUrl(citation);
  const isExternalValid = externalHref !== "#";
  // Prefer routing back into our own /blog/[id] page over the external source when the
  // citation resolves to content we already index, instead of sending users off-site.
  const internalHref = citation.permanentId ? `/blog/${encodeURIComponent(citation.permanentId)}` : undefined;
  const excerptPreview = getExcerptPreview(citation.excerpt);

  function trackClick(destination: "internal" | "external") {
    analytics.track("generative_citation_clicked", {
      citationId: citation.id,
      destination,
      position: index,
      query,
      source: citation.source,
    });
  }

  return (
    <li className="citation-item">
      <span className="citation-marker" aria-label={`Citation ${index}`}>
        {index}
      </span>
      <div>
        <span className="citation-title">{citation.title}</span>
        {citation.source ? (
          <small>
            {citation.source}
            {citation.filetype ? ` · ${citation.filetype.toUpperCase()}` : null}
          </small>
        ) : null}
        {excerptPreview ? <p>{excerptPreview}</p> : null}
        {internalHref ? (
          <Link href={internalHref} onClick={() => trackClick("internal")}>
            Read more
          </Link>
        ) : isExternalValid ? (
          <a href={externalHref} onClick={() => trackClick("external")} rel="noreferrer" target="_blank">
            Read more
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        ) : null}
      </div>
    </li>
  );
}
