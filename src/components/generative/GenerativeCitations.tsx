import { GenerativeCitation } from "@/components/generative/GenerativeCitation";
import type { GenerativeCitation as GenerativeCitationModel } from "@/features/generative/models/generative-models";

export function GenerativeCitations({
  citations,
  query,
}: {
  citations: GenerativeCitationModel[];
  query: string;
}) {
  if (citations.length === 0) {
    return <p className="muted-copy">No citations are available for this answer.</p>;
  }

  return (
    <ol className="citation-list" aria-label="Generated answer citations">
      {citations.map((citation, index) => (
        <GenerativeCitation citation={citation} index={index + 1} key={citation.id} query={query} />
      ))}
    </ol>
  );
}
