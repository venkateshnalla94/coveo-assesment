import { RESULT_TYPE_LABELS } from "@/components/search/search-ui.constants";
import type { SearchResponseResult } from "@/components/search/response/search-response-types";
import { ResultCard } from "@/components/search/results/ResultCard";

function getStringMetadata(result: SearchResponseResult, key: string) {
  const value = result.metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getResultType(result: SearchResponseResult) {
  const filetype = getStringMetadata(result, "filetype");

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
      {results.map((result) => {
        const filetype = getStringMetadata(result, "filetype");

        return (
          <ResultCard
            clickUri={result.url}
            dateLabel={getDateLabel(result.updatedAt)}
            excerpt={result.description}
            key={result.id}
            meta={[result.source, filetype].filter((value): value is string => Boolean(value))}
            printableUri={result.displayUrl ?? result.url}
            resultType={getResultType(result)}
            tags={result.badges ?? []}
            thumbnail={result.imageUrl}
            title={result.title}
          />
        );
      })}
    </div>
  );
}
