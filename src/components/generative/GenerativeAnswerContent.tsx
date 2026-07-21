import { GenerativeCitations } from "@/components/generative/GenerativeCitations";
import type { GenerativeCitation } from "@/features/generative/models/generative-models";

export function GenerativeAnswerContent({
  answer,
  citations,
  query,
}: {
  answer: string;
  citations: GenerativeCitation[];
  query: string;
}) {
  return (
    <div className="generative-content">
      <p>{answer}</p>
      <GenerativeCitations citations={citations} query={query} />
    </div>
  );
}
