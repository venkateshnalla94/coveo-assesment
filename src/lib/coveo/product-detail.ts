import type { ProductDetail, ProductSpec } from "@/features/commerce/models/commerce-models";
import {
  COVEO_SEARCH_API_BASE_URL,
  getSearchHub,
  optionalServerEnv,
  requiredServerEnv,
  withOrganizationId,
} from "@/lib/coveo/server-api";

const UPSTREAM_TIMEOUT_MS = 10_000;

// Engineering spec fields carried by the full indexed record but absent from the Commerce listing
// payload. Ordered so the rendered spec table reads like a datasheet, not index order.
const SPEC_FIELDS: Array<{ field: string; label: string }> = [
  { field: "eng_payload", label: "Payload" },
  { field: "eng_reach", label: "Reach" },
  { field: "eng_repeatability", label: "Repeatability" },
  { field: "eng_axes", label: "Axes" },
  { field: "eng_protocol", label: "Protocol" },
  { field: "eng_ip_rating", label: "IP Rating" },
  { field: "eng_material", label: "Material" },
  { field: "eng_weight", label: "Weight" },
];

type RawRecord = Record<string, unknown>;

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return undefined;
}

function booleanFrom(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

// Coveo multi-value fields come back either as a real array or a ";"-joined string depending on
// the field's configuration — normalize both to a trimmed string[].
function listFrom(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : String(item))).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(";").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function buildSpecifications(raw: RawRecord): ProductSpec[] {
  return SPEC_FIELDS.map(({ field, label }) => {
    const value = stringFrom(raw[field]) ?? (numberFrom(raw[field]) !== undefined ? String(raw[field]) : undefined);
    return value ? { label, value } : undefined;
  }).filter((spec): spec is ProductSpec => Boolean(spec));
}

export function mapRawProductDetail(result: unknown, fallbackId: string): ProductDetail | undefined {
  const item = result && typeof result === "object" ? (result as RawRecord) : {};
  const raw = item.raw && typeof item.raw === "object" ? (item.raw as RawRecord) : {};

  const id = stringFrom(raw.ec_product_id) ?? stringFrom(raw.permanentid) ?? fallbackId;
  const title = stringFrom(raw.ec_name) ?? stringFrom(item.title);

  if (!title) {
    return undefined;
  }

  const images = listFrom(raw.ec_images);
  const thumbnails = listFrom(raw.ec_thumbnails);
  const imageUrl = thumbnails[0] ?? images[0];
  const fullDescription = stringFrom(raw.ec_description);
  const description = stringFrom(raw.ec_shortdesc) ?? stringFrom(raw.ec_summary) ?? fullDescription ?? "";
  const url = stringFrom(item.clickUri) ?? stringFrom(raw.clickableuri) ?? stringFrom(raw.sysclickableuri);
  const permanentId = stringFrom(raw.permanentid);

  return {
    id,
    title,
    description,
    ...(fullDescription ? { fullDescription } : {}),
    ...(url ? { url } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    images,
    ...(stringFrom(raw.ec_brand) ? { brand: stringFrom(raw.ec_brand) } : {}),
    categories: listFrom(raw.ec_category),
    ...(numberFrom(raw.ec_price) !== undefined ? { price: numberFrom(raw.ec_price) } : {}),
    ...(numberFrom(raw.ec_promo_price) !== undefined ? { promoPrice: numberFrom(raw.ec_promo_price) } : {}),
    ...(numberFrom(raw.ec_rating) ?? numberFrom(raw.cat_review_score)) !== undefined
      ? { rating: numberFrom(raw.ec_rating) ?? numberFrom(raw.cat_review_score) }
      : {},
    ...(booleanFrom(raw.ec_in_stock) !== undefined ? { inStock: booleanFrom(raw.ec_in_stock) } : {}),
    ...(stringFrom(raw.ec_item_group_id) ? { itemGroupId: stringFrom(raw.ec_item_group_id) } : {}),
    compatibleRobotSeries: listFrom(raw.compatible_robot_series),
    compatibleRobots: listFrom(raw.compatible_with_robots),
    compatibleJoints: listFrom(raw.compatible_with_joints),
    compatiblePartsSkus: listFrom(raw.compatible_parts_skus),
    // Rich fields the Commerce payload omits:
    ...(stringFrom(raw.ec_sku) ? { sku: stringFrom(raw.ec_sku) } : {}),
    ...(stringFrom(raw.country_of_origin) ? { countryOfOrigin: stringFrom(raw.country_of_origin) } : {}),
    ...(numberFrom(raw.cat_total_reviews) !== undefined ? { reviewCount: numberFrom(raw.cat_total_reviews) } : {}),
    ...(booleanFrom(raw.is_new) !== undefined ? { isNew: booleanFrom(raw.is_new) } : {}),
    ...(booleanFrom(raw.is_discontinued) !== undefined ? { isDiscontinued: booleanFrom(raw.is_discontinued) } : {}),
    specifications: buildSpecifications(raw),
    availabilityRegions: listFrom(raw.stores_inventory),
    recommendedSkus: listFrom(raw.recommended_with),
    fitmentParentSkus: listFrom(raw.fitment_parent_skus),
    providerMetadata: {
      ...(permanentId ? { permanentId } : {}),
      rawResultType: "commerce-product",
    },
  };
}

// permanentid / ec_product_id arrive via a client-controlled route param — escape before
// interpolating into the query expression.
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Narrow, single-product server lookup by id — mirrors the blog article path
// (fetchTrendingArticle): server-only COVEO_PLATFORM_API_KEY, one document by exact field match.
// Not a general search proxy. Returns undefined (never throws) so the PDP degrades to its
// sessionStorage/empty fallback instead of surfacing a server error for a missing product.
export async function fetchProductDetail(id: string): Promise<ProductDetail | undefined> {
  let organizationId: string;
  let apiKey: string;

  try {
    organizationId = requiredServerEnv("COVEO_ORGANIZATION_ID");
    apiKey = requiredServerEnv("COVEO_PLATFORM_API_KEY");
  } catch {
    return undefined;
  }

  const escaped = escapeQueryValue(id);

  let response: Response;
  try {
    response = await fetch(withOrganizationId(COVEO_SEARCH_API_BASE_URL, organizationId), {
      body: JSON.stringify({
        aq: `(@permanentid=="${escaped}") OR (@ec_product_id=="${escaped}")`,
        numberOfResults: 1,
        searchHub: getSearchHub(optionalServerEnv("COVEO_CONTENT_SEARCH_HUB"), optionalServerEnv("COVEO_SEARCH_HUB")),
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
  } catch {
    return undefined;
  }

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json().catch(() => null)) as { results?: unknown[] } | null;
  const first = Array.isArray(data?.results) ? data?.results[0] : undefined;

  return first ? mapRawProductDetail(first, id) : undefined;
}
