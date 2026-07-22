# Interview Notes

## Why Headless Commerce Instead Of Atomic?

30 seconds: Headless Commerce gives full control over a product-discovery experience while keeping Coveo responsible for Commerce search state, facets, suggestions, pagination, and analytics.

Deeper answer: Atomic is strong for fast standard search UI assembly. This assessment needed a robotics buying workflow: product cards, compatibility fields, local comparison, details drawer, RGA, and resources. Headless Commerce fits because it exposes controllers without forcing the UI into prebuilt components.

## Why Use Commerce API For Products And Search API For Resources?

30 seconds: Products and technical content are different domains. Commerce owns catalog discovery; Search API owns resource content and RGA grounding.

Deeper answer: A product result needs Commerce context, facets, pricing, stock, and product metadata. A technical resource is article/documentation content. Mixing them would blur ranking, analytics, and user expectations.

## Why Is RGA Separate From Product Recommendation?

30 seconds: RGA explains and cites technical guidance. It should not be presented as choosing products.

Deeper answer: RGA is grounded in content/blog material, not validated recommendation strategy. Product recommendation requires Commerce recommendation models, clear placement strategy, analytics, and product-governance review. Claiming RGA recommends products would be misleading.

## Why Use An Anonymous API Key In This Assessment?

30 seconds: The validated assessment path is public anonymous catalog discovery, so the browser can use the explicit anonymous key with Headless Commerce.

Deeper answer: This avoids pretending we have identity infrastructure. The code still supports secured token mode separately, but anonymous mode is the correct fit for the supplied assessment context.

## How Would Secured Search Work?

30 seconds: Set `COVEO_AUTH_MODE=search-token`; the browser calls `/api/search-token`; the server mints short-lived tokens with `COVEO_AUTHENTICATED_SEARCH_API_KEY`.

Deeper answer: The server would bind tokens to the signed-in user identity and security provider. Headless Commerce would use the token and renew it through the same route.

## How Do You Prevent Privileged Credentials From Reaching The Browser?

30 seconds: Privileged keys are server-only environment variables and are never exposed through `NEXT_PUBLIC_`.

Deeper answer: Anonymous mode uses only `NEXT_PUBLIC_COVEO_ANONYMOUS_SEARCH_API_KEY`. Search-token mode uses only `COVEO_AUTHENTICATED_SEARCH_API_KEY` server-side. RGA and resources use `COVEO_PLATFORM_API_KEY` only inside server routes.

## Why Were Payload And Reach Not Shown As Structured Specifications?

30 seconds: They were not available as consistent structured catalog fields.

Deeper answer: Showing inconsistent or inferred manufacturing specs would be worse than omitting them. For production, I would normalize those fields into the index first, then expose facets and comparison columns.

## Why Is Sorting Relevance-Only?

30 seconds: The validated Commerce response exposed relevance as the only available sort.

Deeper answer: Adding fake price, rating, or popularity sorting would misrepresent Coveo behavior. Sorting should be added after Commerce sorting is configured and validated.

## Why Keep Comparison State Local?

30 seconds: It is a short-lived shortlist workflow, not a persisted cart or account feature.

Deeper answer: Local state avoids unnecessary backend complexity. Persistence becomes useful only when tied to user accounts, quotes, carts, or sales workflows.

## Why Use Custom Product Cards?

30 seconds: The robotics buyer needs product-specific fields and actions that generic result cards do not express well.

Deeper answer: Product cards show price, rating, stock, brand, category, compatibility, comparison, and details actions. That is a domain UI, not a generic document-search result.

## How Are Facets Generated?

30 seconds: Headless Commerce owns facet state through its facet generator; the app maps those facets into UI models.

Deeper answer: The validated facets are category, compatible robot series, brand, price, and rating. Category is hierarchical, brand and compatible robots are regular, and price/rating are numerical ranges.

## How Do Analytics Work?

30 seconds: Headless Commerce handles Coveo analytics for Commerce interactions, and the app tracks local UI interactions.

Deeper answer: The app-level analytics layer tracks searches, facet selection, comparison, details opens, and CTAs. It must never send tokens, raw payloads, or privileged credentials.

## How Would This Scale?

30 seconds: Coveo scales search and ranking; the app remains a thin controller-driven UI.

Deeper answer: The main scaling work is data quality: normalized attributes, governance, analytics dashboards, identity, and operational monitoring. The UI should stay small and controller-driven.

## How Would You Add A New Product Attribute?

30 seconds: Add it to the index first, confirm it is consistently populated, map it in the Commerce mapper, then expose it in cards, details, facets, or comparison.

Deeper answer: I would not start in the UI. I would validate source data, field naming, type, nullability, localization, and analytics value before presenting it as a buyer decision criterion.

## What Happens If RGA Or Resources Fail?

30 seconds: Product discovery continues. The right rail shows isolated error states.

Deeper answer: Product search, facets, pagination, comparison, and details are not blocked by guidance/resource failures because they are separate provider paths.

## Why Did You Remove The Generic Demo Architecture?

30 seconds: The validated product is Headless Commerce. Keeping generic demo architecture would add dead code and confuse reviewers.

Deeper answer: Once live Commerce was validated, the generic search demo and direct Commerce rollback path became architectural debt. Removing them reduces maintenance, test burden, and credential confusion.

## What Would You Change For Production?

30 seconds: Identity-aware tokens, normalized manufacturing specs, production CTAs, dashboards, Web Vitals, configured sorting, and recommendations.

Deeper answer: I would start with data quality and security: structured payload/reach/certification/controller fields, authenticated identities, scoped tokens, and analytics governance. Then I would add production sales integrations, personalization, recommendation placements, and observability.
