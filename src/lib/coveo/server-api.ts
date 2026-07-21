export const COVEO_SEARCH_API_BASE_URL =
  process.env.COVEO_SEARCH_API_BASE_URL ?? "https://platform-eu.cloud.coveo.com/rest/search/v2";

export function optionalServerEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function requiredServerEnv(name: string) {
  const value = optionalServerEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function withOrganizationId(url: string, organizationId: string) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("organizationId", organizationId);
  return nextUrl.toString();
}

export function getSearchHub(...candidates: Array<string | undefined>) {
  return candidates.find((candidate) => candidate && candidate.trim().length > 0) ?? "robomotion";
}
