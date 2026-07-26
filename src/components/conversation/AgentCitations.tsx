import Link from "next/link";

import { useAnalytics } from "@/features/analytics/analytics";
import type { GenerativeCitation } from "@/features/generative/models/generative-models";
import { getSafeCitationUrl } from "@/features/generative/services/citations";

/** Compact `[1] Title` inline links, in place of the full excerpt list used elsewhere. */
export function AgentCitations({ citations }: { citations: GenerativeCitation[] }) {
  const analytics = useAnalytics();

  if (citations.length === 0) {
    return null;
  }

  return (
    <ol className="agent-citation-list" aria-label="Sources">
      {citations.map((citation, index) => {
        const position = index + 1;
        const internalHref = citation.permanentId ? `/blog/${encodeURIComponent(citation.permanentId)}` : undefined;
        const externalHref = getSafeCitationUrl(citation);
        const isExternalValid = externalHref !== "#";

        function trackClick(destination: "internal" | "external") {
          analytics.track("generative_citation_clicked", {
            citationId: citation.id,
            destination,
            position,
            source: citation.source,
          });
        }

        if (internalHref) {
          return (
            <li key={citation.id}>
              <Link href={internalHref} onClick={() => trackClick("internal")} rel="noreferrer" target="_blank">
                [{position}] {citation.title}
              </Link>
            </li>
          );
        }

        if (isExternalValid) {
          return (
            <li key={citation.id}>
              <a href={externalHref} onClick={() => trackClick("external")} rel="noreferrer" target="_blank">
                [{position}] {citation.title}
              </a>
            </li>
          );
        }

        return (
          <li key={citation.id}>
            [{position}] {citation.title}
          </li>
        );
      })}
    </ol>
  );
}
