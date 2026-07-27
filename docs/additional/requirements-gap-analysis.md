# Assessment Requirements — Gap Analysis

Status snapshot against the TME take-home brief, based on the current `main` branch
(`docs/demo-readiness-report.md`, `README.md`, `outputs/architecture/`). Verdict: **the
brief's functional requirements are met**. The remaining gaps are not missing frontend
work — they are platform-config and source-schema items that sit behind the Coveo
Administration Console, which this candidate doesn't have access to.

## 1. Core Search Experience

| Requirement | Status | Evidence |
| --- | --- | --- |
| Search box, query submission, clear feedback | ✅ Done | `SearchBox`, `SearchSuggestions`, header wiring |
| Result list / product grid | ✅ Done | `ProductGrid`, `ProductResultCard` |
| Facets for ≥4 attributes | ✅ Done (5) | Category, Compatible Robot Models, Brand, Price, Rating — hierarchical, regular, and numerical-range types all covered |
| Query summary / result count | ✅ Done | Commerce `summary` controller wired into the header |
| Sorting / ranking control | ⚠️ Partial | Only `relevance` — confirmed directly against the raw `/commerce/v2/search` response: `sort.availableSorts` returns just `{sortCriteria: "relevance"}`. **This is a platform-config gap, not an unwired frontend control.** |
| Loading / empty / error states | ✅ Done | `ProductStatus`, `ConfigurationNotice`, dedicated E2E coverage |

## 2. Product Presentation

| Requirement | Status | Evidence |
| --- | --- | --- |
| Title, short description, primary use case | ✅ Done | `ProductResultCard`, `ProductDetailView` |
| Scannable key specs | ⚠️ Partial | Price, rating, stock, brand, category, compatible robot models are shown and scannable. Payload, reach, precision, controller, mounting, certification, industry fit are **not indexed as structured fields** in this catalog, so they cannot be surfaced or faceted regardless of frontend work. |
| Explains why a result is relevant | ✅ Done | Highlighted query terms (`HighlightedText`), compatibility fields, facet-driven narrowing |
| Clear next action | ✅ Done | Compare, product details drawer/page, Contact Sales, Request Quote (flagged in-app as demo interactions, not wired to a live CRM) |

## 3. Deliverables

| Deliverable | Status |
| --- | --- |
| Working application | ✅ `npm run dev` / `npm run build` both green per readiness report |
| Source code + setup instructions | ✅ `README.md` |
| README (framework choice, setup, assumptions, limitations, future work) | ✅ Present and current |
| Demo script | ✅ `docs/demo-script.md` (20-min and 5-min versions) |
| Architecture explanation | ✅ `docs/architecture.md` + 14-section `outputs/architecture/` snapshot |

Nothing is missing here — this is the strongest part of the submission.

## 4. Services used vs. available

| Service | Used? | Notes |
| --- | --- | --- |
| Commerce API | ✅ | Primary product discovery path |
| Search API | ✅ | Technical Resources / blog content, isolated from product path |
| Query Suggestions | ✅ | Wired into search box |
| RGA | ✅ | "AI Product Guidance," explicitly scoped as content guidance, not product recommendation |
| Conversational Search Agent | ✅ Done | Global chat widget (`src/components/conversation/`) backed by Coveo's Search Agent API (agentic RAG, AG-UI protocol) at `/api/coveo/conversation`. Multi-turn, streaming, page-context aware. Feature-flagged off by default (`COVEO_FEATURE_CONVERSATION_ENABLED`) — flip it on for a live demo. See `outputs/architecture/15-conversational-agent-flow.md` and ADR 0012. |
| Commerce Product Recommendations | ❌ N/A | Brief states this capability **is not configured** on this org — cannot be used regardless of frontend effort. |
| Commerce Product Listings | ❌ N/A | Same — explicitly not configured. |

## 5. What's actually missing, split by who can fix it

### A. Fixable in code, no console access needed
Nothing outstanding. Everything the frontend controls (facets wired to available fields,
loading/empty/error states, comparison, product detail views, analytics events, a11y,
responsive layout, the Conversational Search Agent) is already implemented and tested.

One live-demo caveat on the Conversational Search Agent specifically: head-turn questions
to the Search Agent frequently come back `NOT_ANSWERED`, and successful follow-up answers
can take 15–25s (multiple search/think loops) before the first token streams. Pre-seed a
known-good question before the audience arrives, or narrate through the wait — don't rely
on an ad-hoc live question as a demo moment. See `docs/demo-readiness-report.md`.

### B. Blocked — needs the Coveo team / console access
These are the genuine gaps, and they require someone with org/console access (or index
source ownership) to change platform config or source data — not something buildable
from the frontend:

1. **Sorting beyond relevance.** The Merchandising Hub commerce listing config for pipeline
   `cmh-search-robomotion-05bd0bce` only exposes `relevance` in `availableSorts`. Ask the
   Coveo team to enable field sorting on `ec_price` and `ec_rating` on the commerce
   listing/sort config.
2. **Manufacturing-spec facets** (payload, reach, precision, mounting type, certification,
   industry, controller compatibility). These fields don't exist as structured, facetable
   metadata in the indexed source. This needs the data-source/catalog owner to add them as
   indexed fields, then the Coveo team to expose them as Commerce facets in the console —
   the current 5 facets (`ec_category`, `compatible_robot_models`, `ec_brand`, `ec_price`,
   `ec_rating`) are the only ones configured on this org.
3. **Product Recommendations / Product Listings.** Explicitly stated as not configured on
   this org in the brief. Ask the Coveo team to enable and configure these Commerce
   capabilities if the demo should showcase them.
4. **Query Suggestions / RGA tuning** (if it comes up in Q&A): the suggestion model and RGA
   pipeline configuration (grounding sources, prompt, model) live in the console — the app
   only calls the already-configured pipeline/model. Any tuning request goes to the Coveo
   team.

### C. Deliberately out of scope (by design, not a gap)
- Turning the Search API content routes into a general search proxy — explicitly excluded
  by `CLAUDE.md` to keep the security boundary narrow (`COVEO_PLATFORM_API_KEY` stays
  server-only).
- Contact Sales / Request Quote as live CRM integrations — correctly scoped as demo
  interactions since no CRM was provided.

## 6. Recommended talking points for Q&A

Frame both blocked items (B1, B2) as **you diagnosed them precisely against the live
API**, not that you assumed a limitation:
- Sorting: "I checked `sort.availableSorts` on the raw Commerce response directly — only
  relevance is offered by the listing config. In a live engagement I'd enable field sorting
  for price and rating."
- Facets: "I verified against the live index which fields are actually facetable —
  category, brand, price, rating, compatible robot models. The manufacturing spec fields
  the brief mentions (payload, reach, mounting, certification) aren't in this catalog's
  schema, so building fake facets for them would misrepresent what the platform is
  actually indexing. Here's what I'd ask the catalog team to add."

This is a stronger answer than silently working around it, and it's already the framing
your `docs/demo-script.md` uses — this document just consolidates it as a submission
checklist.
