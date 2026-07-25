import { NextResponse } from "next/server";

import { createAgUiToContractTransformStream } from "@/lib/coveo/ag-ui-stream";
import { requiredServerEnv } from "@/lib/coveo/server-api";
import { getSearchAgentFollowUpUrl, getSearchAgentHeadAnswerUrl, getSearchAgentId } from "@/lib/coveo/search-agent-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 300;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function parseRequestBody(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const q = typeof body.q === "string" ? body.q.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;
  const conversationToken = typeof body.conversationToken === "string" ? body.conversationToken : undefined;
  return { conversationId, conversationToken, q };
}

export async function POST(request: Request) {
  let organizationId: string;
  let apiKey: string;
  let agentId: string;

  try {
    organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
    apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");
    agentId = getSearchAgentId();
  } catch {
    return NextResponse.json(
      { error: "The conversational agent is not configured." },
      { headers: noStoreHeaders, status: 500 },
    );
  }

  const { conversationId, conversationToken, q } = parseRequestBody(await request.json().catch(() => ({})));

  if (!q) {
    return NextResponse.json({ error: "A question is required." }, { headers: noStoreHeaders, status: 400 });
  }

  const isFollowUp = Boolean(conversationId && conversationToken);
  const url = isFollowUp
    ? getSearchAgentFollowUpUrl(organizationId, agentId)
    : getSearchAgentHeadAnswerUrl(organizationId, agentId);
  const body = isFollowUp ? { conversationId, conversationToken, q } : { q };

  const upstreamResponse = await fetch(url, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      Accept: "text/event-stream, application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  }).catch(() => undefined);

  if (!upstreamResponse || !upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      { error: "The conversational agent could not be reached." },
      { headers: noStoreHeaders, status: 502 },
    );
  }

  const stream = upstreamResponse.body.pipeThrough(createAgUiToContractTransformStream());

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/event-stream",
    },
  });
}
