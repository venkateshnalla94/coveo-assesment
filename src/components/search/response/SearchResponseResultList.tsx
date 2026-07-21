import { RESULT_TYPE_LABELS } from "@/components/search/search-ui.constants";
import type { SearchResponseResult } from "@/components/search/response/search-response-types";
import { ResultCard } from "@/components/search/results/ResultCard";

function getResultType(filetype: string | undefined) {
  if (!filetype) {
    return "Content";
  }

  return RESULT_TYPE_LABELS[filetype.toLowerCase()] ?? filetype;
}

function getDateLabel(date: string | undefined) {
  if (!date) {
    return undefined;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function SearchResponseResultList({ results }: { results: SearchResponseResult[] }) {
  return (
    <div className="result-stack">
      {results.map((result) => (
        <ResultCard
          clickUri={result.clickUri}
          dateLabel={getDateLabel(result.date)}
          excerpt={result.excerpt}
          key={result.uniqueId}
          meta={[result.source, result.filetype].filter((value): value is string => Boolean(value))}
          printableUri={result.printableUri}
          resultType={getResultType(result.filetype)}
          tags={result.tags}
          thumbnail={result.thumbnail}
          title={result.title}
        />
      ))}
    </div>
  );
}
