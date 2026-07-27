import { NextResponse } from "next/server";

import type { GenerativeAnswer, GenerativeCitation } from "@/features/generative/models/generative-models";
import {
  COVEO_SEARCH_API_BASE_URL,
  getSearchHub,
  optionalServerEnv,
  requiredServerEnv,
  withOrganizationId,
} from "@/lib/coveo/server-api";
import { getClientIp, isRateLimited } from "@/lib/http/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const UPSTREAM_TIMEOUT_MS = 10_000;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function normalizeQuery(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return typeof body.query === "string" ? body.query.trim() : "";
}

function getStreamId(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const extendedResults =
    body.extendedResults && typeof body.extendedResults === "object"
      ? (body.extendedResults as Record<string, unknown>)
      : {};
  return typeof extendedResults.generativeQuestionAnsweringId === "string"
    ? extendedResults.generativeQuestionAnsweringId
    : undefined;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseEventStream(text: string) {
  let answer = "";
  let answerGenerated = true;
  const citations = new Map<string, GenerativeCitation>();

  for (const eventBlock of text.split(/\r?\n\r?\n/)) {
    const lines = eventBlock.split(/\r?\n/);
    const eventType = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");

    if (!data) {
      continue;
    }

    const directPayload = parseJson(data);
    const envelope = directPayload && typeof directPayload === "object" ? (directPayload as Record<string, unknown>) : {};
    const payloadType = typeof envelope.payloadType === "string" ? envelope.payloadType : eventType;
    const payloadValue = typeof envelope.payload === "string" ? envelope.payload : data;
    const payload = parseJson(payloadValue);
    const payloadObject = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

    if (payloadType === "genqa.messageType" && typeof payloadObject.textDelta === "string") {
      answer += payloadObject.textDelta;
    }

    if (payloadType === "genqa.citationsType" && Array.isArray(payloadObject.citations)) {
      for (const citation of payloadObject.citations) {
        const item = citation && typeof citation === "object" ? (citation as Record<string, unknown>) : {};
        const id = typeof item.id === "string" ? item.id : typeof item.uri === "string" ? item.uri : undefined;
        const url = typeof item.clickUri === "string" ? item.clickUri : typeof item.uri === "string" ? item.uri : undefined;
        // Fields requested via citationsFieldToInclude come back nested under `fields`, not flattened onto the citation.
        const fields = item.fields && typeof item.fields === "object" ? (item.fields as Record<string, unknown>) : {};

        if (id && url) {
          citations.set(id, {
            excerpt: typeof item.text === "string" ? item.text : undefined,
            filetype: typeof fields.filetype === "string" ? fields.filetype : undefined,
            id,
            // Same permanentid scheme trending content and /blog/[id] key off of, so a citation
            // pointing at one of our indexed articles can link internally instead of externally.
            permanentId: typeof item.permanentid === "string" ? item.permanentid : undefined,
            source: typeof fields.source === "string" ? fields.source : undefined,
            title: typeof item.title === "string" ? item.title : url,
            url,
          });
        }
      }
    }

    if (payloadType === "genqa.endOfStreamType" && payloadObject.answerGenerated === false) {
      answerGenerated = false;
    }
  }

  return { answer, answerGenerated, citations: Array.from(citations.values()) };
}

function getPlatformBaseUrl() {
  return new URL(COVEO_SEARCH_API_BASE_URL).origin;
}

export async function POST(request: Request) {
  if (isRateLimited(getClientIp(request), RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { headers: noStoreHeaders, status: 429 },
    );
  }

  try {
    const organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
    const apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");
    const query = normalizeQuery(await request.json().catch(() => ({})));

    if (!query) {
      return NextResponse.json({ answer: null }, { headers: noStoreHeaders });
    }

    const searchResponse = await fetch(withOrganizationId(COVEO_SEARCH_API_BASE_URL, organizationId), {
      body: JSON.stringify({
        firstResult: 0,
        locale: optionalServerEnv("COVEO_COMMERCE_LANGUAGE") ?? "en",
        numberOfResults: 10,
        pipeline: optionalServerEnv("COVEO_RGA_PIPELINE") ?? optionalServerEnv("COVEO_PIPELINE"),
        pipelineRuleParameters: {
          mlGenerativeQuestionAnswering: {
            citationsFieldToInclude: ["source", "filetype"],
            responseFormat: {
              contentFormat: ["text/plain"],
            },
          },
        },
        q: query,
        searchHub: getSearchHub(optionalServerEnv("COVEO_RGA_SEARCH_HUB"), optionalServerEnv("COVEO_SEARCH_HUB")),
      }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!searchResponse.ok) {
      return NextResponse.json({ error: "Generated answer could not be loaded." }, { headers: noStoreHeaders, status: 502 });
    }

    const streamId = getStreamId(await searchResponse.json());

    if (!streamId) {
      return NextResponse.json({ answer: null }, { headers: noStoreHeaders });
    }

    const streamResponse = await fetch(
      `${getPlatformBaseUrl()}/rest/organizations/${encodeURIComponent(organizationId)}/machinelearning/streaming/${encodeURIComponent(
        streamId,
      )}`,
      {
        cache: "no-store",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${apiKey}`,
        },
        method: "GET",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );

    if (!streamResponse.ok) {
      return NextResponse.json({ error: "Generated answer stream could not be loaded." }, { headers: noStoreHeaders, status: 502 });
    }

    const parsed = parseEventStream(await streamResponse.text());

    if (!parsed.answerGenerated || !parsed.answer.trim()) {
      return NextResponse.json({ answer: null }, { headers: noStoreHeaders });
    }

    const answer: GenerativeAnswer = {
      answer: parsed.answer.trim(),
      citations: parsed.citations,
      generatedAt: new Date().toISOString(),
      id: streamId,
      query,
    };

    return NextResponse.json({ answer }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ error: "Generated answers are not configured." }, { headers: noStoreHeaders, status: 500 });
  }
}
