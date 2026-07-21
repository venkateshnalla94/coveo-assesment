import type { GenerativeCitation } from "@/features/generative/models/generative-models";

const fallbackCitationUrl = "#";

export function getSafeCitationUrl(citation: Pick<GenerativeCitation, "url">) {
  try {
    const url = new URL(citation.url);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return fallbackCitationUrl;
  }

  return fallbackCitationUrl;
}
