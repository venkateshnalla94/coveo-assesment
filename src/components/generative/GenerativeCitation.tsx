"use client";

import { ExternalLink } from "lucide-react";

import { useAnalytics } from "@/features/analytics/analytics";
import type { GenerativeCitation as GenerativeCitationModel } from "@/features/generative/models/generative-models";
import { getSafeCitationUrl } from "@/features/generative/services/citations";

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
  const href = getSafeCitationUrl(citation);
  const isValid = href !== "#";

  return (
    <li className="citation-item">
      <span className="citation-marker" aria-label={`Citation ${index}`}>
        {index}
      </span>
      <div>
        {isValid ? (
          <a
            href={href}
            onClick={() =>
              analytics.track("generative_citation_clicked", {
                citationId: citation.id,
                query,
                source: citation.source,
                position: index,
              })
            }
            rel="noreferrer"
            target="_blank"
          >
            {citation.title}
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        ) : (
          <span>{citation.title}</span>
        )}
        {citation.source ? <small>{citation.source}</small> : null}
        {citation.excerpt ? <p>{citation.excerpt}</p> : null}
      </div>
    </li>
  );
}
