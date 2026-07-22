import { getCommerceFacetLabel } from "@/features/commerce/config/commerce-config";
import type {
  ProductFacet,
  ProductFacetValue,
  ProductHierarchicalFacetValue,
  ProductPagination,
  ProductRangeFacetValue,
  ProductResult,
} from "@/features/commerce/models/commerce-models";

type RawRecord = Record<string, unknown>;

type HeadlessProductLike = {
  additionalFields?: RawRecord;
  clickUri?: string;
  ec_brand?: string | null;
  ec_category?: string[];
  ec_description?: string | null;
  ec_images?: string[];
  ec_in_stock?: boolean | null;
  ec_item_group_id?: string | null;
  ec_name?: string | null;
  ec_price?: number | null;
  ec_product_id?: string | null;
  ec_promo_price?: number | null;
  ec_rating?: number | null;
  ec_shortdesc?: string | null;
  ec_thumbnails?: string[];
  excerpt?: string | null;
  permanentid?: string;
};

type HeadlessFacetLike = {
  state: {
    displayName?: string;
    field: string;
    facetId?: string;
    type: "regular" | "hierarchical" | "numericalRange" | "dateRange";
    values: unknown[];
    domain?: {
      min: number;
      max: number;
    };
  };
};

export function resolveProductId(product: HeadlessProductLike, index: number): string {
  return (
    asString(product.ec_product_id) ??
    asString(product.permanentid) ??
    asString(getField(product, "ec_product_id")) ??
    `commerce-product-${index + 1}`
  );
}

export function mapHeadlessProduct(product: HeadlessProductLike, index: number): ProductResult {
  const id = resolveProductId(product, index);
  const fullDescription = asString(product.ec_description) ?? asString(getField(product, "ec_description"));
  const description =
    asString(product.ec_shortdesc) ??
    asString(product.excerpt) ??
    asString(getField(product, "ec_shortdesc")) ??
    fullDescription ??
    "";
  const images = firstNonEmptyArray(product.ec_images, asStringArray(getField(product, "ec_images")));
  const thumbnails = firstNonEmptyArray(product.ec_thumbnails, asStringArray(getField(product, "ec_thumbnails")));
  const imageUrl = thumbnails[0] ?? images[0];

  return {
    id,
    title: asString(product.ec_name) ?? asString(getField(product, "ec_name")) ?? "Untitled product",
    description,
    ...(fullDescription ? { fullDescription } : {}),
    ...(asString(product.clickUri) ? { url: asString(product.clickUri) } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    images,
    ...(asString(product.ec_brand) ? { brand: asString(product.ec_brand) } : {}),
    categories: firstNonEmptyArray(product.ec_category, asStringArray(getField(product, "ec_category"))),
    ...(asNumber(product.ec_price) !== undefined ? { price: asNumber(product.ec_price) } : {}),
    ...(asNumber(product.ec_promo_price) !== undefined ? { promoPrice: asNumber(product.ec_promo_price) } : {}),
    ...(asNumber(product.ec_rating) !== undefined ? { rating: asNumber(product.ec_rating) } : {}),
    ...(asBoolean(product.ec_in_stock) !== undefined ? { inStock: asBoolean(product.ec_in_stock) } : {}),
    ...(asString(product.ec_item_group_id) ? { itemGroupId: asString(product.ec_item_group_id) } : {}),
    compatibleRobotSeries: firstNonEmptyArray(
      asStringArray(getField(product, "compatible_robot_series")),
      asStringArray(getField(product, "compatible_robot_models")),
    ),
    compatibleRobots: asStringArray(getField(product, "compatible_with_robots")),
    compatibleJoints: asStringArray(getField(product, "compatible_with_joints")),
    compatiblePartsSkus: asStringArray(getField(product, "compatible_parts_skus")),
    ...(asString(product.excerpt) ? { excerpt: asString(product.excerpt) } : {}),
    providerMetadata: {
      ...(asString(product.permanentid) ? { permanentId: asString(product.permanentid) } : {}),
      rawResultType: "commerce-product",
    },
  };
}

export function mapHeadlessFacets(facets: HeadlessFacetLike[]): ProductFacet[] {
  return facets
    .map((facet) => mapHeadlessFacet(facet))
    .filter((facet): facet is ProductFacet => Boolean(facet));
}

export function mapHeadlessPagination({
  page,
  pageSize,
  totalEntries,
  totalPages,
}: {
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
}): ProductPagination {
  return {
    page,
    perPage: pageSize,
    totalEntries,
    totalPages,
    totalProducts: totalEntries,
  };
}

function mapHeadlessFacet(facet: HeadlessFacetLike): ProductFacet | undefined {
  const { state } = facet;
  const base = {
    field: state.field,
    id: state.facetId ?? state.field,
    label: getCommerceFacetLabel(state.field, state.displayName),
  };

  if (state.type === "regular") {
    return {
      ...base,
      type: "regular",
      values: state.values
        .map((rawFacetValue): ProductFacetValue | undefined => {
          const value = asRecord(rawFacetValue);
          const facetValue = asString(value.value);

          if (!facetValue) {
            return undefined;
          }

          return {
            count: asNumber(value.numberOfResults) ?? 0,
            label: facetValue,
            selected: value.state === "selected",
            value: facetValue,
          };
        })
        .filter((value): value is ProductFacetValue => Boolean(value)),
    };
  }

  if (state.type === "hierarchical") {
    return {
      ...base,
      type: "hierarchical",
      values: state.values
        .map((rawFacetValue): ProductHierarchicalFacetValue | undefined => {
          const value = asRecord(rawFacetValue);
          const facetValue = asString(value.value);

          if (!facetValue) {
            return undefined;
          }

          return {
            count: asNumber(value.numberOfResults) ?? 0,
            isLeafValue: Boolean(value.isLeafValue),
            label: facetValue,
            path: asStringArray(value.path),
            selected: value.state === "selected",
            value: facetValue,
          };
        })
        .filter((value): value is ProductHierarchicalFacetValue => Boolean(value)),
    };
  }

  if (state.type === "numericalRange") {
    return {
      ...base,
      type: "numericalRange",
      ...(state.domain ? { domain: { ...state.domain, increment: 1 } } : {}),
      values: state.values
        .map((rawFacetValue): ProductRangeFacetValue | undefined => {
          const value = asRecord(rawFacetValue);
          const start = asNumber(value.start);
          const end = asNumber(value.end);

          if (start === undefined || end === undefined) {
            return undefined;
          }

          return {
            count: asNumber(value.numberOfResults) ?? 0,
            end,
            endInclusive: Boolean(value.endInclusive),
            selected: value.state === "selected",
            start,
          };
        })
        .filter((value): value is ProductRangeFacetValue => Boolean(value)),
    };
  }

  return undefined;
}

function getField(product: HeadlessProductLike, field: string): unknown {
  return (product as RawRecord)[field] ?? product.additionalFields?.[field];
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? (value as RawRecord) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function firstNonEmptyArray(...values: Array<string[] | undefined>) {
  return values.find((value) => value && value.length > 0) ?? [];
}
