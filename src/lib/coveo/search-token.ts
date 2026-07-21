export type SearchTokenConfig = {
  token: string;
  organizationId: string;
  searchHub: string;
  pipeline: string;
  facetFields: string[];
};

export async function fetchSearchTokenConfig(options: { signal?: AbortSignal } = {}): Promise<SearchTokenConfig> {
  const response = await fetch("/api/search-token", {
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Unable to initialize Coveo search.");
  }

  return (await response.json()) as SearchTokenConfig;
}
