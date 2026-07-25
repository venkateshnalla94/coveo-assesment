import { requiredServerEnv } from "@/lib/coveo/server-api";

/**
 * The Search Agent API (agentic RAG, AG-UI protocol) is a distinct resource family from the
 * Search API / Answer Config API: host is `{orgId}.org.coveo.com`, not `platform-eu.cloud.coveo.com`,
 * and paths are `/api/v1/organizations/{orgId}/agents/{agentId}/...`. Verified against the live org.
 */
export function getSearchAgentHeadAnswerUrl(organizationId: string, agentId: string) {
  return `https://${organizationId}.org.coveo.com/api/v1/organizations/${encodeURIComponent(
    organizationId,
  )}/agents/${encodeURIComponent(agentId)}/answer`;
}

export function getSearchAgentFollowUpUrl(organizationId: string, agentId: string) {
  return `https://${organizationId}.org.coveo.com/api/v1/organizations/${encodeURIComponent(
    organizationId,
  )}/agents/${encodeURIComponent(agentId)}/follow-up`;
}

export function getSearchAgentId() {
  return requiredServerEnv("COVEO_SEARCH_AGENT_ID");
}
