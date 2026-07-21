import { toSearchFeatureFlags, type SearchFeatureFlags } from "@/lib/features/search-feature-flags";
import { resolveRuntimeConfig } from "@/lib/runtime/runtime-config";

export function getSearchFeatureFlags(): SearchFeatureFlags {
  return toSearchFeatureFlags(resolveRuntimeConfig().featureFlags);
}
