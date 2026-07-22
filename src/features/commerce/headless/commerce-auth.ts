export type CoveoAuthMode = "anonymous-api-key" | "search-token";

export type HeadlessCommerceAuthConfig =
  | {
      mode: "anonymous-api-key";
      organizationId: string;
      accessToken: string;
    }
  | {
      mode: "search-token";
    }
  | {
      mode: "configuration-error";
      message: string;
    };

export function isCoveoAuthMode(value: string | undefined): value is CoveoAuthMode {
  return value === "anonymous-api-key" || value === "search-token";
}
