import { COMMERCE_DEFAULTS } from "@/features/commerce/config/commerce-config";
import type { ProductFacetSelection } from "@/features/commerce/models/commerce-models";

export const commerceSuggestedQueries = [
  "welding arm",
  "collaborative robot",
  "palletizing",
  "precision",
  "robot safety",
];

const products = [
  product({
    id: "NXB-ROB-TBL021-001",
    name: "NexBot Robotics TBL021-001 Collaborative Robot Arm 5kg Payload",
    description:
      "This collaborative robot arm offers a 5kg payload and is designed for safe welding-cell interaction in tabletop applications.",
    fullDescription:
      "The TBL021-001 is a compact, 6-axis collaborative robot arm designed for welding-cell automation tasks requiring precision, safe interaction, and fast deployment.",
    brand: "NexBot Robotics",
    categories: ["Robots", "Robots|Collaborative Robots", "Robots|Collaborative Robots|Tabletop Cobots (≤5kg)"],
    price: 18500,
    rating: 4.2,
    series: "C-5",
    robots: "C-5",
    joints: "J1;J2;J3;J4;J5;J6",
    parts: "NXB-SNS-812-006;NXB-MNT-642-007;NXB-SNS-SD312-007",
  }),
  product({
    id: "NXB-ROB-FLR022-004",
    name: "NexBot Robotics FLR022-004 Collaborative Robot Arm 10kg Payload",
    description:
      "A versatile 6-axis collaborative robot designed for safe human-robot interaction and complex assembly tasks.",
    fullDescription:
      "The FLR022-004 collaborative arm is built for medium-duty automation where teams need safe interaction, repeatable handling, and floor-mounted flexibility.",
    brand: "NexBot Robotics",
    categories: ["Robots", "Robots|Collaborative Robots", "Robots|Collaborative Robots|Floor Cobots (5-20kg)"],
    price: 32500,
    rating: 3.5,
    series: "C-5",
    robots: "C-5",
    joints: "J1;J2;J3;J4;J5;J6",
    parts: "NXB-CBL-512-004;NXB-CBL-531-005;NXB-SNS-341-007",
  }),
  product({
    id: "NXB-GEN-TIG432-015",
    name: "NexBot Vision TIG432-015 320A TIG Welding Torch",
    description:
      "High-performance TIG welding torch for robotic automation with precise, spatter-free welds.",
    fullDescription:
      "A 320A TIG welding torch designed for robotic cells that need reliable duty cycle, clean weld quality, and end-of-arm compatibility.",
    brand: "NexBot Vision",
    categories: ["End-of-Arm Tooling", "End-of-Arm Tooling|Welding Torches", "End-of-Arm Tooling|Welding Torches|TIG Torches"],
    price: 3450,
    rating: 3.5,
    series: "R-20;R-50;C-10",
    robots: "R-20;R-50;C-10",
    joints: "J6",
  }),
  product({
    id: "NXB-GEN-MIG431-002",
    name: "NexBot Drives MIG431-002 Mig/Mag Welding Torch",
    description:
      "Robotic MIG/MAG welding torch engineered for automated fabrication and heavy industrial use.",
    fullDescription:
      "The MIG431-002 supports high-current robotic welding cells where production teams need robust torch compatibility and consistent weld performance.",
    brand: "NexBot Drives",
    categories: ["End-of-Arm Tooling", "End-of-Arm Tooling|Welding Torches", "End-of-Arm Tooling|Welding Torches|MIG/MAG Torches"],
    price: 3250,
    rating: 4.8,
    series: "R-20;R-50;R-100",
    robots: "R-20;R-50;R-100",
    joints: "J6",
  }),
  product({
    id: "NXB-GEN-ELC412-012",
    name: "NexBot Safety ELC412-012 Electric Gripper with 12mm Stroke",
    description:
      "Compact electric gripper for high-precision handling with adjustable force and IO-Link interface.",
    fullDescription:
      "The ELC412-012 gripper helps automation teams add controlled handling to collaborative and industrial robot cells.",
    brand: "NexBot Safety",
    categories: ["End-of-Arm Tooling", "End-of-Arm Tooling|Grippers", "End-of-Arm Tooling|Grippers|Electric Grippers"],
    price: 2150,
    rating: 4.2,
    series: "C-10;R-10;R-20",
    robots: "C-10;R-10;R-20",
    joints: "J6",
  }),
  product({
    id: "NXB-SNS-VIS211-006",
    name: "NexBot Vision VIS211-006 3D Vision Camera",
    description:
      "Industrial 3D vision camera for robot guidance, inspection, and flexible picking applications.",
    fullDescription:
      "The VIS211-006 brings calibrated 3D sensing into robotic cells for inspection and location-aware automation tasks.",
    brand: "NexBot Vision",
    categories: ["Sensors & Vision", "Sensors & Vision|Machine Vision", "Sensors & Vision|Machine Vision|3D Cameras"],
    price: 4850,
    rating: 4.7,
    series: "C-10;R-20;R-50;S-5",
    robots: "C-10;R-20;R-50;S-5",
  }),
  product({
    id: "NXB-MNT-612-012",
    name: "NexBot Safety 612-012 Adjustable Steel Light Curtain Mount Set",
    description:
      "Adjustable steel mount set for robot-cell safety light curtains and guarded automation areas.",
    fullDescription:
      "This mount set supports safety-system deployment in robot cells where light curtain placement and service access matter.",
    brand: "NexBot Safety",
    categories: ["Safety Systems", "Safety Systems|Safety Fencing", "Safety Systems|Safety Fencing|Light Curtain Mounts"],
    price: 225.5,
    rating: 3.5,
    series: "C-10;R-20;S-5",
    robots: "C-10;R-20;S-5",
  }),
  product({
    id: "NXB-GEN-711-010",
    name: "NexBot Robotics 711-010 High-Precision Tapered Roller Bearing",
    description:
      "High-duty-cycle bearing that supports smooth, precise motion in articulated robot joints.",
    fullDescription:
      "The 711-010 bearing is a wear-part option for robot maintenance programs that need predictable replacement planning.",
    brand: "NexBot Robotics",
    categories: ["Wear Parts & Consumables", "Wear Parts & Consumables|Bearings & Seals", "Wear Parts & Consumables|Bearings & Seals|Joint Bearings"],
    price: 475.5,
    rating: 4.5,
    series: "R-50;R-100;C-10",
    robots: "R-50;R-100;C-10",
    joints: "J1;J2",
  }),
];

export const mockCommerceSearchResponse = {
  executionReport: null,
  products,
  queryCorrection: {
    correctedQuery: null,
    corrections: [],
    originalQuery: null,
  },
  responseId: "mock-commerce-response",
  results: [],
  sort: {
    appliedSort: { sortCriteria: "relevance" },
    availableSorts: [{ sortCriteria: "relevance" }],
  },
  triggers: [],
};

export function buildMockCommerceResponse({
  facets,
  page,
  perPage,
  query,
}: {
  facets: ProductFacetSelection[];
  page: number;
  perPage: number;
  query: string;
}) {
  const filtered = products.filter((item) => matchesText(item, query) && matchesFacets(item, facets));
  const start = page * perPage;

  return {
    ...mockCommerceSearchResponse,
    facets: buildFacets(filtered, facets),
    pagination: {
      page,
      perPage,
      totalEntries: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
      totalProducts: filtered.length,
      totalSpotlightContent: 0,
    },
    products: filtered.slice(start, start + perPage),
  };
}

function product({
  brand,
  categories,
  description,
  fullDescription,
  id,
  joints,
  name,
  parts,
  price,
  rating,
  robots,
  series,
}: {
  brand: string;
  categories: string[];
  description: string;
  fullDescription: string;
  id: string;
  joints?: string;
  name: string;
  parts?: string;
  price: number;
  rating: number;
  robots?: string;
  series?: string;
}) {
  const imageBase = `https://images.barca.group/robotics/${id}/${id}`;

  return {
    additionalFields: {
      compatible_parts_skus: parts ?? null,
      compatible_robot_series: series ?? null,
      compatible_with_joints: joints ?? null,
      compatible_with_robots: robots ?? null,
      ec_brand: brand,
      ec_category: categories,
      ec_description: fullDescription,
      ec_images: [`${imageBase}_515x515.jpg`],
      ec_in_stock: "true",
      ec_item_group_id: id.split("-").slice(0, 3).join("-"),
      ec_name: name,
      ec_price: price,
      ec_product_id: id,
      ec_promo_price: null,
      ec_rating: rating,
      ec_shortdesc: description,
      ec_thumbnails: [`${imageBase}_300x300.jpg`],
      permanentid: id,
    },
    badgePlacements: [],
    children: [],
    clickUri: `https://robotics.barca.group/p/${id}`,
    ec_brand: brand,
    ec_category: categories,
    ec_description: fullDescription,
    ec_images: [`${imageBase}_515x515.jpg`],
    ec_in_stock: true,
    ec_item_group_id: id.split("-").slice(0, 3).join("-"),
    ec_name: name,
    ec_price: price,
    ec_product_id: id,
    ec_promo_price: null,
    ec_rating: rating,
    ec_shortdesc: description,
    ec_thumbnails: [`${imageBase}_300x300.jpg`],
    excerpt: fullDescription,
    excerptHighlights: [],
    nameHighlights: [],
    permanentid: id,
    queryPinned: false,
    resultType: "product",
    totalNumberOfChildren: 0,
  };
}

function matchesText(item: (typeof products)[number], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    item.ec_name,
    item.ec_description,
    item.ec_shortdesc,
    item.ec_brand,
    ...(item.ec_category ?? []),
    item.additionalFields.compatible_robot_series,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchableText.includes(term));
}

function matchesFacets(item: (typeof products)[number], facets: ProductFacetSelection[]) {
  return facets.every((facet) => {
    if (facet.type === "regular") {
      const values =
        facet.field === "compatible_robot_series"
          ? splitList(item.additionalFields.compatible_robot_series)
          : splitList(String(item[facet.field as keyof typeof item] ?? ""));

      return facet.values.some((value) => values.includes(value));
    }

    if (facet.type === "hierarchical") {
      return facet.values.some((value) => item.ec_category.includes(value));
    }

    if (facet.type === "numericalRange") {
      const value = facet.field === "ec_price" ? item.ec_price : item.ec_rating;
      return value >= facet.start && value <= facet.end;
    }

    return true;
  });
}

function buildFacets(items: typeof products, selections: ProductFacetSelection[]) {
  return [
    regularOrHierarchicalFacet("hierarchical", "ec_category", "Category", items.flatMap((item) => item.ec_category), selections),
    regularOrHierarchicalFacet(
      "regular",
      "compatible_robot_series",
      "Compatible Robots",
      items.flatMap((item) => splitList(item.additionalFields.compatible_robot_series)),
      selections,
    ),
    regularOrHierarchicalFacet("regular", "ec_brand", "Brand", items.map((item) => item.ec_brand), selections),
    rangeFacet("ec_price", "Price", items.map((item) => item.ec_price), selections),
    rangeFacet("ec_rating", "Rating", items.map((item) => item.ec_rating), selections),
  ];
}

function regularOrHierarchicalFacet(
  type: "regular" | "hierarchical",
  field: string,
  displayName: string,
  values: string[],
  selections: ProductFacetSelection[],
) {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    ...(type === "hierarchical" ? { delimitingCharacter: "|" } : {}),
    displayName,
    facetId: field,
    field,
    fromAutoSelect: false,
    isFieldExpanded: false,
    moreValuesAvailable: false,
    numberOfValues: 10,
    type,
    values: Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, 10)
      .map(([value, count]) => ({
        ...(type === "hierarchical" ? { children: [], isLeafValue: !value.includes("|"), path: value.split("|") } : {}),
        numberOfResults: count,
        state: isSelected(field, value, selections) ? "selected" : "idle",
        value,
      })),
  };
}

function rangeFacet(field: "ec_price" | "ec_rating", displayName: string, values: number[], selections: ProductFacetSelection[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const selected = selections.some(
    (selection) => selection.type === "numericalRange" && selection.field === field && selection.start === min && selection.end === max,
  );

  return {
    displayName,
    domain: { increment: 0, max: Math.ceil(max), min: Math.floor(min) },
    facetId: field,
    field,
    fromAutoSelect: false,
    interval: "continuous",
    isFieldExpanded: false,
    moreValuesAvailable: false,
    numberOfValues: 1,
    type: "numericalRange",
    values: [
      {
        end: max,
        endInclusive: true,
        numberOfResults: values.length,
        start: min,
        state: selected ? "selected" : "idle",
      },
    ],
  };
}

function isSelected(field: string, value: string, selections: ProductFacetSelection[]) {
  return selections.some(
    (selection) =>
      (selection.type === "regular" || selection.type === "hierarchical") &&
      selection.field === field &&
      selection.values.includes(value),
  );
}

function splitList(value: string | null | undefined) {
  return (value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const defaultCommerceRequest = {
  facets: [],
  page: 0,
  perPage: COMMERCE_DEFAULTS.perPage,
  query: "welding arm",
};
