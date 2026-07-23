import { NextResponse } from "next/server";

import { CoveoContentRequestError, searchTrendingContent } from "@/lib/coveo/content-search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function normalizeBody(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : "robotics";
  const numberOfResults =
    typeof body.numberOfResults === "number" && Number.isFinite(body.numberOfResults)
      ? Math.min(8, Math.max(1, Math.floor(body.numberOfResults)))
      : 4;

  return { numberOfResults, query };
}

export async function POST(request: Request) {
  try {
    const body = normalizeBody(await request.json().catch(() => ({})));
    const items = await searchTrendingContent(body.query, body.numberOfResults);

    return NextResponse.json({ items }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof CoveoContentRequestError) {
      return NextResponse.json({ error: "Technical resources could not be loaded." }, { headers: noStoreHeaders, status: 502 });
    }

    return NextResponse.json({ error: "Technical resources are not configured." }, { headers: noStoreHeaders, status: 500 });
  }
}
