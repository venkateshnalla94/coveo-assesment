import type { GenerativeAnswer } from "@/features/generative/models/generative-models";
import type { DemoProfileId } from "@/features/demo-profiles/demo-profiles";
import type {
  FacetValue,
  SearchFacet,
  SearchResponse,
  SearchResult,
} from "@/features/search/models/search-models";
import type { TrendingItem } from "@/features/trending/models/trending-models";

export interface DemoProfileFixtures {
  generativeAnswer?: Omit<GenerativeAnswer, "id" | "query">;
  searchResponse: SearchResponse;
  suggestedQueries: string[];
  trendingItems: TrendingItem[];
}

const fixtureDate = "2026-01-01T00:00:00.000Z";

export const profileFixtures: Record<DemoProfileId, DemoProfileFixtures> = {
  "industrial-product-discovery": {
    generativeAnswer: {
      answer:
        "Fixture-backed product guidance: use Commerce product results for product selection, then use technical resources to evaluate application fit, compatibility, and robot-cell safety considerations.",
      citations: [
        citation("robotics-citation-welding", "Choosing the Right Robot for Welding Cells", "/resources/robotic-welding-guide"),
        citation("robotics-citation-compatibility", "Robot Compatibility Planning Guide", "/resources/compatibility-planning"),
      ],
      generatedAt: fixtureDate,
    },
    searchResponse: response("RoboMotion Product Discovery", "welding arm", [
      result("robotics-guide", "Choosing the Right Robot for Welding Cells", "Technical buying guidance for industrial welding automation.", "article", "Technical Resources", "html", "Robotics"),
      result("robotics-safety", "Robotic Welding Safety Best Practices", "Safety planning resource for welding robot cells.", "documentation", "Technical Resources", "pdf", "Robotics"),
      result("robotics-compatibility", "Robot Compatibility Planning Guide", "How to evaluate compatible robots, tooling, and joints.", "documentation", "Technical Resources", "html", "Robotics"),
    ]),
    suggestedQueries: ["welding arm", "collaborative robot", "palletizing", "precision"],
    trendingItems: [
      trend("robotics-trend-welding", 1, "Choosing the Right Robot for Welding Cells", "article", "Sample technical resource"),
      trend("robotics-trend-compatibility", 2, "Robot Compatibility Planning Guide", "documentation", "Sample technical resource"),
      trend("robotics-trend-safety", 3, "Robotic Welding Safety Best Practices", "article", "Sample technical resource"),
    ],
  },
  "customer-support": {
    generativeAnswer: {
      answer:
        "Fixture-backed support summary: start by checking identity-provider mapping, then compare the failed login path with the documented troubleshooting guide and known community workaround.",
      citations: [
        citation("support-citation-login", "Login troubleshooting guide", "/support/login-troubleshooting"),
        citation("support-citation-policy", "Support escalation policy", "/support/escalation-policy"),
      ],
      generatedAt: fixtureDate,
    },
    searchResponse: response("Support Knowledge Search", "login troubleshooting", [
      result("support-login", "Login troubleshooting guide", "Step-by-step recovery for failed authentication and identity mapping.", "documentation", "Knowledge Base", "html", "Platform"),
      result("support-sso", "SSO troubleshooting checklist", "Checks for SAML claims, user identifiers, and provider configuration.", "documentation", "Troubleshooting", "pdf", "Platform"),
      result("support-community", "Community answer: authentication loops", "Community-sourced workaround for repeated login redirects.", "community", "Community", "web", "Platform"),
      result("support-policy", "Case escalation policy", "When to escalate login and authorization cases to platform operations.", "article", "Support Policies", "html", "Services"),
      result("support-content", "Case deflection content quality", "How support teams identify knowledge gaps from repeated authentication cases.", "article", "Knowledge Base", "html", "Services"),
    ]),
    suggestedQueries: ["login troubleshooting", "case deflection", "community answer quality"],
    trendingItems: [
      trend("support-trend-login", 1, "Login troubleshooting guide", "documentation", "Most opened support article"),
      trend("support-trend-sso", 2, "SSO troubleshooting checklist", "documentation", "Rising support case pattern"),
      trend("support-trend-policy", 3, "Case escalation policy", "article", "Referenced by support agents"),
    ],
  },
  "developer-documentation": {
    generativeAnswer: {
      answer:
        "Fixture-backed developer summary: use a short-lived token from the server, initialize Headless in the browser, and keep privileged platform credentials out of client bundles.",
      citations: [
        citation("docs-citation-auth", "Authenticated search token guide", "/docs/authenticated-search-token"),
        citation("docs-citation-headless", "Headless controller implementation guide", "/docs/headless-controllers"),
      ],
      generatedAt: fixtureDate,
    },
    searchResponse: response("Developer Documentation Search", "digital transformation", [
      result("docs-auth", "Authenticated search token guide", "Mint short-lived search tokens without exposing platform API keys.", "documentation", "Documentation", "html", "Headless"),
      result("docs-headless", "Headless facets implementation", "Authentication-aware Headless facet controllers with accessible filter controls.", "documentation", "API Guides", "html", "Headless"),
      result("docs-pipeline", "Query pipeline configuration", "Authentication context, search hubs, pipelines, and ranking rules for technical audiences.", "documentation", "SDK Reference", "pdf", "Search"),
      result("docs-next", "Next.js Headless setup tutorial", "Authentication setup for a secured App Router search page with token-based Headless initialization.", "article", "Developer Tutorials", "html", "Headless"),
      result("docs-analytics", "Usage analytics event reference", "Authentication-safe analytics for result clicks, suggestions, facets, and pagination.", "documentation", "SDK Reference", "html", "Analytics"),
      result("docs-digital", "Digital transformation architecture", "Digital transformation and authentication guidance for teams modernizing secure search experiences.", "article", "Developer Tutorials", "html", "Search"),
    ]),
    suggestedQueries: ["authentication", "headless facets", "query pipeline configuration"],
    trendingItems: [
      trend("docs-trend-auth", 1, "Authenticated search token guide", "documentation", "Most viewed implementation guide"),
      trend("docs-trend-headless", 2, "Headless facets implementation", "documentation", "Frequently opened after authentication"),
      trend("docs-trend-next", 3, "Next.js Headless setup tutorial", "article", "Rising developer tutorial"),
    ],
  },
  ecommerce: {
    searchResponse: response("Commerce Product Search", "product recommendations", [
      result("commerce-hoodie", "Trail running hoodie", "Moisture-wicking product card with popularity and brand metadata.", "product", "Catalog", "product", "Apparel", "Northstar"),
      result("commerce-jacket", "All-weather shell jacket", "Popular product with category, brand, and merchandising signals.", "product", "Catalog", "product", "Outerwear", "Apex"),
      result("commerce-pack", "Commuter laptop backpack", "High-converting product with brand and category facets.", "product", "Catalog", "product", "Bags", "Northstar"),
      result("commerce-guide", "Product recommendations tuning guide", "Merchandising guide for ranking, popularity, and personalization.", "documentation", "Merchandising", "html", "Discovery"),
      result("commerce-category", "Category discovery playbook", "How commerce teams tune category and brand discovery paths.", "article", "Merchandising", "html", "Discovery"),
    ]),
    suggestedQueries: ["commerce personalization", "product recommendations", "popular products"],
    trendingItems: [
      trend("commerce-trend-hoodie", 1, "Trail running hoodie", "product", "Popular product fixture"),
      trend("commerce-trend-jacket", 2, "All-weather shell jacket", "product", "Highest conversion fixture"),
      trend("commerce-trend-pack", 3, "Commuter laptop backpack", "product", "Rising product fixture"),
    ],
  },
  minimal: {
    searchResponse: response("Minimal Search", "digital transformation", [
      result("minimal-overview", "Digital transformation overview", "Small generic result set for the core search loop.", "article", "Resources", "html", "General"),
      result("minimal-guide", "Search relevance basics", "A concise guide to ranking, filtering, and content quality.", "documentation", "Resources", "pdf", "General"),
      result("minimal-checklist", "Implementation checklist", "Generic implementation checklist for reviewers.", "article", "Resources", "html", "General"),
    ]),
    suggestedQueries: ["digital transformation", "search relevance", "implementation checklist"],
    trendingItems: [],
  },
};

function response(searchHub: string, query: string, results: SearchResult[]): SearchResponse {
  return {
    durationMs: 42,
    facets: buildFacets(results),
    query,
    results,
    searchHub,
    totalCount: results.length,
  };
}

function result(
  id: string,
  title: string,
  description: string,
  type: SearchResult["type"],
  source: string,
  filetype: string,
  product: string,
  brand?: string,
): SearchResult {
  return {
    badges: brand ? [brand, product] : [product],
    description,
    displayUrl: `https://example.coveo.local/${id}`,
    id,
    metadata: {
      brand: brand ?? null,
      filetype,
      popularity: id.length * 10,
      product,
    },
    source,
    title,
    type,
    updatedAt: fixtureDate,
    url: `https://example.coveo.local/${id}`,
  };
}

function buildFacets(results: SearchResult[]): SearchFacet[] {
  return [
    facet("filetype", "Content Type", results.map((item) => String(item.metadata!.filetype))),
    facet("source", "Source", results.map((item) => item.source!)),
    facet("product", "Product", results.map((item) => String(item.metadata!.product))),
  ];
}

function facet(field: string, label: string, values: string[]): SearchFacet {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    field,
    id: `facet-${field}`,
    label,
    values: [
      { count: values.length, label: "All", selected: true, value: "All" },
      ...Object.entries(counts)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, count]): FacetValue => ({ count, label: value, selected: false, value })),
    ],
  };
}

function citation(id: string, title: string, path: string) {
  return {
    excerpt: "Profile-specific fixture citation for sample-mode generated answers.",
    id,
    source: "Fixture knowledge base",
    title,
    url: `https://example.coveo.local${path}`,
  };
}

function trend(
  id: string,
  rank: number,
  title: string,
  type: TrendingItem["type"],
  reason: string,
): TrendingItem {
  return {
    id,
    rank,
    reason,
    timeWindow: "Last 7 days",
    title,
    trendPercentage: 20 - rank * 3,
    type,
    url: `https://example.coveo.local/trending/${id}`,
    viewCount: 1000 - rank * 100,
  };
}
