import { BookOpen, File, FileText, MessageSquare, Package, Video } from "lucide-react";

import { ResultCard } from "@/components/search/results/ResultCard";
import type { SearchResult } from "@/features/search/models/search-models";
import {
  getResultDateLabel,
  getResultDescription,
  getResultVariant,
  getSafeResultUrl,
  type ResultVariant,
} from "@/features/search/services/result-templates";

const variantLabels: Record<ResultVariant, string> = {
  article: "Article",
  community: "Community",
  default: "Content",
  documentation: "Documentation",
  product: "Product",
  video: "Video",
};

const variantIconLabels: Record<ResultVariant, string> = {
  article: "Article",
  community: "Community",
  default: "Content",
  documentation: "Documentation",
  product: "Product",
  video: "Video",
};

export function DomainResultCard({
  onSelect,
  position,
  query,
  result,
}: {
  onSelect?: (result: SearchResult, position: number, query: string) => void;
  position?: number;
  query?: string;
  result: SearchResult;
}) {
  const variant = getResultVariant(result);
  const safeUrl = getSafeResultUrl(result);
  const metadata = [
    result.source,
    typeof result.metadata?.filetype === "string" ? result.metadata.filetype : undefined,
  ].filter((value): value is string => Boolean(value));

  return (
    <ResultCard
      clickUri={safeUrl}
      dateLabel={getResultDateLabel(result.updatedAt)}
      excerpt={getResultDescription(result)}
      meta={metadata}
      onSelect={() => onSelect?.(result, position ?? 1, query ?? "")}
      printableUri={result.displayUrl ?? (safeUrl === "#" ? "Unavailable URL" : safeUrl)}
      resultType={variantLabels[variant]}
      tags={result.badges ?? []}
      thumbnail={result.imageUrl}
      title={result.title}
      typeIcon={getVariantIcon(variant)}
      typeLabel={variantIconLabels[variant]}
    />
  );
}

function getVariantIcon(variant: ResultVariant) {
  switch (variant) {
    case "article":
      return BookOpen;
    case "community":
      return MessageSquare;
    case "documentation":
      return FileText;
    case "product":
      return Package;
    case "video":
      return Video;
    default:
      return File;
  }
}
