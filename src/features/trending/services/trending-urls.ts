import type { TrendingItem } from "@/features/trending/models/trending-models";

export function getSafeTrendingUrl(item: Pick<TrendingItem, "url">) {
  try {
    const url = new URL(item.url);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return "#";
  }

  return "#";
}
