# Demo Script

## 20-Minute Version

## 0:00-2:00: RoboMotion And The Problem

RoboMotion sells industrial robotics products into manufacturing contexts where buyers need confidence before they shortlist equipment. The problem is not just keyword search. A buyer needs to narrow a large catalog by category, brand, price, rating, and — critically — confirmed compatibility with the robot series they already own.

Position the app as a product discovery experience, not a generic search demo. The narrative is fitment, not spec-sheet comparison: a systems integrator's real question is "will this part work with the arm I already have?" That is the strongest story this catalog can tell, and `compatible_robot_series` is a first-class facet for exactly that reason.

## 2:00-6:00: Search `welding arm`

Type `wel` and show query suggestions. Submit `welding arm`.

Show:

- result count
- product cards
- price and promo price where present
- rating
- stock
- category and brand
- compatible robot series

Explain that the product path is live Headless Commerce against the Commerce API.

## 6:00-10:00: Facets, Pagination, And Sorting

Apply the five validated facets:

- Category
- Compatible Robot Series
- Brand
- Price
- Rating

Explain the facet types:

- hierarchical facets for category-style narrowing
- regular facets for brand and compatible robot series
- numerical-range facets for price and rating

Show pagination and address sorting head-on: it's relevance-only because that's the only `availableSorts` entry the Merchandising Hub interface config returns — confirmed by inspecting the raw Commerce API response, not assumed. Frame it as a platform-config lever, not a gap: "here's what I'd turn on for `ec_price`/`ec_rating` field sorting on the listing config in a live engagement."

## 10:00-13:00: Comparison

Select up to three products for comparison. Open the comparison drawer.

Explain the customer value: a buyer moves from a broad catalog to a confident shortlist without losing compatibility and commercial context. This is the same broad-to-specific shape as a payload/reach comparison would be on a purpose-built spec index — it just narrows on the dimensions this catalog actually has: category, brand, price, rating, and compatible robot series, rather than on manufacturing specs the index doesn't carry.

## 13:00-15:00: Product Details

Open a product details drawer.

Show:

- descriptions
- images
- compatibility fields
- product URL
- Contact Sales and Request Quote actions

Clarify that these CTAs are demo interactions until connected to production CRM or commerce systems.

## 15:00-17:00: AI Guidance And Resources

Show AI Product Guidance and Technical Resources.

Explain that RGA is grounded in content/blog material and supports technical research. It does not pick products and is not a product recommendation engine. Technical Resources use the Search API independently from Commerce products.

## 17:00-19:00: Architecture, Auth, Analytics, Failure Isolation

Use the architecture summary:

```text
Next.js UI
├── Headless Commerce
│   └── Coveo Commerce API
├── Generative Provider
│   └── RGA
└── Content Provider
    └── Coveo Search API
```

Explain:

- anonymous assessment mode uses the public anonymous API key
- secured production mode uses `/api/search-token`
- there is no credential fallback
- Headless Commerce owns product search behavior and analytics
- RGA and resources fail independently from product search

## Address The Data Model Directly

Say this before moving to production next steps, not as an apology:

"This demo runs on a standard Commerce catalog rather than a purpose-built engineering spec index — which is realistic, since in a live engagement I wouldn't control the source schema either. I verified directly against the live API which fields are actually indexed and facetable, and built the discovery experience around those: category, brand, price, rating, and compatible robot series. Here's what I'd ask the catalog team to add if I could shape the source."

## 19:00-20:00: Production Evolution

Close with customer value and production next steps:

- structured manufacturing specifications (payload, reach, precision, mounting, certifications, controller compatibility) added to the index as facetable fields
- production CTA integrations
- identity-aware search
- analytics dashboards
- configured Commerce sorting and recommendations

## 5-Minute Version

1. Open with the buyer problem: narrow a robotics catalog quickly and safely.
2. Search `welding arm`, show suggestions, result count, cards, price, rating, stock, and compatibility.
3. Apply category, compatible robot series, brand, price, and rating facets; mention relevance-only sorting and pagination.
4. Compare three products and open one product detail drawer.
5. Show AI Product Guidance and Technical Resources; state clearly that RGA is guidance, not recommendations.
6. Close with the architecture and auth boundary: Headless Commerce for products, RGA for guidance, Search API for resources, no credential fallback.
