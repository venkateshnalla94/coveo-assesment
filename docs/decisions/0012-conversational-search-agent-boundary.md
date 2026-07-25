# ADR 0012: Conversational Search Agent Boundary

## Status

Accepted

## Context

A global floating chat widget was added, backed by Coveo's Search Agent API (agentic RAG over the AG-UI protocol). This is a different Coveo resource family from everything else in the repo: the Search Agent API lives at `{orgId}.org.coveo.com/api/v1/organizations/{orgId}/agents/{agentId}/answer` (and `/follow-up`), not `platform-eu.cloud.coveo.com/rest/search/v2` (Search API, used by RGA and Technical Resources) or the Commerce API (used by product search). It also streams AG-UI protocol SSE events (`RUN_STARTED`, `STEP_STARTED`, `TEXT_MESSAGE_CHUNK`, `CUSTOM`, `RUN_FINISHED`, `RUN_ERROR`), a shape unrelated to RGA's or Commerce's response formats.

Unlike RGA or Technical Resources, the widget is mounted once, globally, in `src/app/layout.tsx` — a sibling of the page tree rather than owned by any one route — so it needs a page-context mechanism (`AgentContextProvider`) rather than per-page wiring.

ADR 0003 already establishes the pattern for isolating a generative capability behind its own `*Provider` interface with normalized domain state, live/mock implementations, and a discriminated state union for UI workflow state, so the client-side conversation state mirrors that shape rather than inventing a new one.

## Decision

- Add `src/app/api/coveo/conversation/route.ts`, following the same server-only-`COVEO_PLATFORM_API_KEY` boundary as the RGA and content routes (per CLAUDE.md's "Architecture" list), but calling the Search Agent API instead of the Search API. It shares no code with the RGA route.
- Add `src/lib/coveo/search-agent-api.ts` (Search Agent URL builders) and `src/lib/coveo/ag-ui-stream.ts` (a `TransformStream` that reduces the upstream AG-UI SSE event sequence into this app's own smaller `step`/`token`/`citations`/`done`/`no-answer`/`error` SSE contract) so the browser never has to parse AG-UI directly.
- Add a `ConversationProvider` interface (`stream()`) with a live `CoveoConversationProvider` and a `mock-conversation-provider.ts`, mirroring ADR 0003's `GenerativeProvider` split, plus a reducer-driven `conversation-state.ts` state machine for streaming/step/citation/error UI states.
- Mount the widget globally via `AgentMountpoint` in `src/app/layout.tsx`, wrapped by a new `AgentContextProvider` that publishes the current page's `PageContext` (kind/title/id/query) through two split React contexts so a page can enrich agent context without the agent becoming a parent of `children`.
- Render answer text with `react-markdown` (no `rehype-raw`), so model output can never inject raw HTML; only markdown syntax is rendered, and answer-body links are forced to safe `target`/`rel`.
- Gate the whole feature behind `COVEO_FEATURE_CONVERSATION_ENABLED` (default `false`) and require `COVEO_SEARCH_AGENT_ID` (server-only) only when enabled.

## Consequences

- CLAUDE.md's non-proxy server-route inventory now lists three narrow routes instead of two; the "do not turn any of these into a full search proxy" instruction still applies to all three.
- The Search Agent API integration is fully isolated from Commerce, RGA, and Technical Resources — a conversational-agent outage does not affect product discovery or the other two content paths, and vice versa.
- Adding a fourth Coveo-backed capability was cheaper than it would otherwise have been because it reused the ADR 0003 provider-boundary shape rather than inventing new state-management conventions.
- No Playwright E2E coverage exists for the widget yet (Vitest covers the stream transform, provider, and route).
