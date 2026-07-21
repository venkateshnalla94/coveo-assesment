import {
  getCommerceFacetLabel,
  getCommerceFacetOrder,
} from "@/features/commerce/config/commerce-config";
import type {
  ProductFacet,
  ProductFacetValue,
  ProductHierarchicalFacetValue,
  ProductFacetSelection,
  ProductPagination,
  ProductRangeFacetValue,
  ProductResult,
  ProductSearchResponse,
} from "@/features/commerce/models/commerce-models";

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return undefined;
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

function getField(product: RawRecord, field: string): unknown {
  return product[field] ?? asRecord(product.additionalFields)[field];
}

function getFirstImage(product: RawRecord) {
  return asStringArray(getField(product, "ec_thumbnails"))[0] ?? asStringArray(getField(product, "ec_images"))[0];
}

function mapProduct(rawProduct: unknown, index: number): ProductResult {
  const product = asRecord(rawProduct);
  const id =
    asString(getField(product, "ec_product_id")) ??
    asString(getField(product, "permanentid")) ??
    `commerce-product-${index + 1}`;
  const fullDescription = asString(getField(product, "ec_description"));
  const description =
    asString(getField(product, "ec_shortdesc")) ??
    asString(product.excerpt) ??
    fullDescription ??
    "";
  const images = asStringArray(getField(product, "ec_images"));
  const imageUrl = getFirstImage(product);

  return {
    id,
    title: asString(getField(product, "ec_name")) ?? "Untitled product",
    description,
    ...(fullDescription ? { fullDescription } : {}),
    ...(asString(product.clickUri) ? { url: asString(product.clickUri) } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    images,
    ...(asString(getField(product, "ec_brand")) ? { brand: asString(getField(product, "ec_brand")) } : {}),
    categories: asStringArray(getField(product, "ec_category")),
    ...(asNumber(getField(product, "ec_price")) !== undefined ? { price: asNumber(getField(product, "ec_price")) } : {}),
    ...(asNumber(getField(product, "ec_promo_price")) !== undefined
      ? { promoPrice: asNumber(getField(product, "ec_promo_price")) }
      : {}),
    ...(asNumber(getField(product, "ec_rating")) !== undefined ? { rating: asNumber(getField(product, "ec_rating")) } : {}),
    ...(asBoolean(getField(product, "ec_in_stock")) !== undefined
      ? { inStock: asBoolean(getField(product, "ec_in_stock")) }
      : {}),
    ...(asString(getField(product, "ec_item_group_id")) ? { itemGroupId: asString(getField(product, "ec_item_group_id")) } : {}),
    compatibleRobotSeries: asStringArray(getField(product, "compatible_robot_series")),
    compatibleRobots: asStringArray(getField(product, "compatible_with_robots")),
    compatibleJoints: asStringArray(getField(product, "compatible_with_joints")),
    compatiblePartsSkus: asStringArray(getField(product, "compatible_parts_skus")),
    ...(asString(product.excerpt) ? { excerpt: asString(product.excerpt) } : {}),
    providerMetadata: {
      ...(asString(getField(product, "permanentid")) ? { permanentId: asString(getField(product, "permanentid")) } : {}),
      ...(asString(product.resultType) ? { rawResultType: asString(product.resultType) } : {}),
    },
  };
}

function isRangeSelected(field: string, value: ProductRangeFacetValue, selections: ProductFacetSelection[]) {
  return selections.some(
    (selection) =>
      selection.type === "numericalRange" &&
      selection.field === field &&
      selection.start === value.start &&
      selection.end === value.end,
  );
}

function isValueSelected(field: string, value: string, selections: ProductFacetSelection[]) {
  return selections.some(
    (selection) =>
      (selection.type === "regular" || selection.type === "hierarchical") &&
      selection.field === field &&
      selection.values.includes(value),
  );
}

function mapFacet(rawFacet: unknown, selections: ProductFacetSelection[]): ProductFacet | undefined {
  const facet = asRecord(rawFacet);
  const field = asString(facet.field);

  if (!field) {
    return undefined;
  }

  const type = asString(facet.type);
  const values = Array.isArray(facet.values) ? facet.values.map(asRecord) : [];
  const label = getCommerceFacetLabel(field, asString(facet.displayName));
  const base = {
    field,
    id: asString(facet.facetId) ?? field,
    label,
  };

  if (type === "numericalRange") {
    return {
      ...base,
      type,
      domain: mapDomain(facet.domain),
      values: values
        .map((value) => {
          const start = asNumber(value.start);
          const end = asNumber(value.end);

          if (start === undefined || end === undefined) {
            return undefined;
          }

          const mapped = {
            count: asNumber(value.numberOfResults) ?? 0,
            end,
            endInclusive: Boolean(value.endInclusive),
            selected: false,
            start,
          };

          return { ...mapped, selected: isRangeSelected(field, mapped, selections) };
        })
        .filter((value): value is ProductRangeFacetValue => Boolean(value)),
    };
  }

  if (type === "hierarchical") {
    return {
      ...base,
      type,
      ...(asString(facet.delimitingCharacter) ? { delimitingCharacter: asString(facet.delimitingCharacter) } : {}),
      values: values
        .map((value) => {
          const rawValue = asString(value.value);

          if (!rawValue) {
            return undefined;
          }

          return {
            count: asNumber(value.numberOfResults) ?? 0,
            isLeafValue: Boolean(value.isLeafValue),
            label: rawValue,
            path: asStringArray(value.path),
            selected: isValueSelected(field, rawValue, selections),
            value: rawValue,
          };
        })
        .filter((value): value is ProductHierarchicalFacetValue => Boolean(value)),
    };
  }

  if (type === "regular") {
    return {
      ...base,
      type,
      values: values
        .map((value) => {
          const rawValue = asString(value.value);

          if (!rawValue) {
            return undefined;
          }

          return {
            count: asNumber(value.numberOfResults) ?? 0,
            label: rawValue,
            selected: isValueSelected(field, rawValue, selections),
            value: rawValue,
          };
        })
        .filter((value): value is ProductFacetValue => Boolean(value)),
    };
  }

  return undefined;
}

function mapDomain(value: unknown) {
  const domain = asRecord(value);
  const min = asNumber(domain.min);
  const max = asNumber(domain.max);
  const increment = asNumber(domain.increment);

  if (min === undefined || max === undefined || increment === undefined) {
    return undefined;
  }

  return { increment, max, min };
}

function mapPagination(value: unknown, productsLength: number): ProductPagination {
  const pagination = asRecord(value);

  return {
    page: asNumber(pagination.page) ?? 0,
    perPage: asNumber(pagination.perPage) ?? productsLength,
    totalEntries: asNumber(pagination.totalEntries) ?? productsLength,
    totalPages: asNumber(pagination.totalPages) ?? 1,
    totalProducts: asNumber(pagination.totalProducts) ?? productsLength,
  };
}

export function mapCommerceSearchResponse(
  rawResponse: unknown,
  selections: ProductFacetSelection[] = [],
): ProductSearchResponse {
  const response = asRecord(rawResponse);
  const rawProducts = Array.isArray(response.products) ? response.products : [];
  const products = rawProducts.map(mapProduct);
  const pagination = mapPagination(response.pagination, products.length);
  const sort = asRecord(response.sort);
  const availableSorts = Array.isArray(sort.availableSorts)
    ? sort.availableSorts.map((item) => asString(asRecord(item).sortCriteria)).filter((value): value is string => Boolean(value))
    : ["relevance"];

  return {
    appliedSort: asString(asRecord(sort.appliedSort).sortCriteria) ?? "relevance",
    availableSorts: availableSorts.length > 0 ? availableSorts : ["relevance"],
    facets: (Array.isArray(response.facets) ? response.facets : [])
      .map((facet) => mapFacet(facet, selections))
      .filter((facet): facet is ProductFacet => Boolean(facet))
      .sort((left, right) => getCommerceFacetOrder(left.field) - getCommerceFacetOrder(right.field)),
    pagination,
    products,
    queryCorrection: response.queryCorrection,
    totalCount: pagination.totalProducts || pagination.totalEntries || products.length,
  };
}
