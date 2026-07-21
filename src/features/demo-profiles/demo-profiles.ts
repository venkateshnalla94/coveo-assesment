import type { FeatureFlagOverrides } from "@/features/feature-flags/feature-flags";

export type DemoProfileId =
  | "developer-documentation"
  | "customer-support"
  | "ecommerce"
  | "minimal";

export type FacetConfiguration = {
  field: "filetype" | "source" | "product" | "updatedDate";
  label: string;
  enabled: boolean;
};

export interface DemoProfile {
  id: DemoProfileId;
  name: string;
  description: string;
  audience: string;
  businessProblem: string;
  featureFlags: FeatureFlagOverrides;
  suggestedQueries: string[];
  facetConfiguration: FacetConfiguration[];
  branding?: {
    title?: string;
    subtitle?: string;
  };
  fixtureSet?: string;
}

export const DEFAULT_DEMO_PROFILE_ID: DemoProfileId = "developer-documentation";

export const demoProfiles: Record<DemoProfileId, DemoProfile> = {
  "customer-support": {
    audience: "Support leaders and knowledge managers",
    branding: {
      subtitle: "Resolve support issues faster with surfaced knowledge and generated context.",
      title: "Support Knowledge Search",
    },
    businessProblem: "Deflect repeat cases and help agents find trusted troubleshooting content quickly.",
    description: "Knowledge articles, community content, source facets, and generated troubleshooting context.",
    facetConfiguration: [
      { enabled: true, field: "source", label: "Source" },
      { enabled: true, field: "filetype", label: "Content Type" },
    ],
    featureFlags: {
      facets: { contentType: true, enabled: true, product: false, source: true },
      generative: { citations: true, disclaimer: true, enabled: true, feedback: true },
      insights: { enabled: true, popularContent: true, relatedQueries: true, topic: true },
      search: { querySuggestions: true },
    },
    fixtureSet: "support",
    id: "customer-support",
    name: "Customer Support",
    suggestedQueries: ["login troubleshooting", "case deflection", "community answer quality"],
  },
  "developer-documentation": {
    audience: "Developers and technical evaluators",
    branding: {
      subtitle: "Search documentation, implementation guides, and technical resources.",
      title: "Developer Documentation Search",
    },
    businessProblem: "Help technical users find implementation guidance without creating support drag.",
    description: "Documentation-oriented results with product/source facets, suggestions, and cited answers.",
    facetConfiguration: [
      { enabled: true, field: "product", label: "Product" },
      { enabled: true, field: "source", label: "Source" },
      { enabled: true, field: "filetype", label: "Content Type" },
    ],
    featureFlags: {
      facets: { contentType: true, enabled: true, product: true, source: true },
      generative: { citations: true, disclaimer: true, enabled: true, feedback: true },
      insights: { enabled: true, popularContent: true, relatedQueries: true, topic: true },
      search: { querySuggestions: true },
    },
    fixtureSet: "documentation",
    id: "developer-documentation",
    name: "Developer Documentation",
    suggestedQueries: ["authentication", "headless facets", "query pipeline configuration"],
  },
  ecommerce: {
    audience: "Digital commerce teams",
    branding: {
      subtitle: "Find products, compare categories, and tune discovery behavior.",
      title: "Commerce Product Search",
    },
    businessProblem: "Improve product discovery while keeping merchandising controls visible.",
    description: "Product card emphasis with product facets and popularity sorting in sample mode.",
    facetConfiguration: [
      { enabled: true, field: "product", label: "Product" },
      { enabled: true, field: "source", label: "Source" },
    ],
    featureFlags: {
      facets: { contentType: false, enabled: true, product: true, source: true },
      generative: { enabled: false },
      insights: { enabled: true, popularContent: true, relatedQueries: true, topic: false },
      results: { badges: true, thumbnails: true },
      search: { querySuggestions: true },
    },
    fixtureSet: "ecommerce",
    id: "ecommerce",
    name: "Ecommerce",
    suggestedQueries: ["commerce personalization", "product recommendations", "popular products"],
  },
  minimal: {
    audience: "Reviewers who need the core search loop",
    branding: {
      subtitle: "Core search box, result list, relevance sorting, and little else.",
      title: "Minimal Search",
    },
    businessProblem: "Demonstrate the smallest stable search experience without secondary blocks.",
    description: "Search box and result list with optional sections disabled.",
    facetConfiguration: [],
    featureFlags: {
      facets: { contentType: false, enabled: false, product: false, source: false },
      generative: { citations: false, disclaimer: false, enabled: false, feedback: false },
      insights: { enabled: false, popularContent: false, relatedQueries: false, topic: false },
      trending: { enabled: false },
    },
    fixtureSet: "minimal",
    id: "minimal",
    name: "Minimal",
    suggestedQueries: ["digital transformation"],
  },
};

export function isDemoProfileId(value: string | undefined): value is DemoProfileId {
  return Boolean(value && value in demoProfiles);
}

export function resolveDemoProfile(value: string | undefined): DemoProfile {
  return demoProfiles[isDemoProfileId(value) ? value : DEFAULT_DEMO_PROFILE_ID];
}
