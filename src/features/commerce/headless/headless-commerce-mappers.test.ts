import { describe, expect, it } from "vitest";

import {
  getSortCriterionId,
  mapHeadlessFacets,
  mapHeadlessPagination,
  mapHeadlessProduct,
  mapHeadlessSort,
} from "@/features/commerce/headless/headless-commerce-mappers";

describe("headless commerce mappers", () => {
  it("normalizes Headless Commerce products into product result cards", () => {
    expect(
      mapHeadlessProduct(
        {
          additionalFields: {
            compatible_robot_models: ["NexBot Vision"],
            compatible_with_joints: "J1;J2",
          },
          clickUri: "https://example.test/products/arm",
          ec_brand: "RoboMotion",
          ec_category: ["Robotics|Welding"],
          ec_description: "Full welding arm description.",
          ec_images: ["https://example.test/image-large.jpg"],
          ec_in_stock: true,
          ec_name: "RM WeldPro 20",
          ec_price: 12_500,
          ec_product_id: "rm-weldpro-20",
          ec_promo_price: 11_950,
          ec_rating: 8.7,
          ec_shortdesc: "Welding cell robotic arm.",
          ec_thumbnails: ["https://example.test/image-thumb.jpg"],
          excerpt: "Relevant for welding arm searches.",
          permanentid: "sku-1",
        },
        0,
      ),
    ).toMatchObject({
      brand: "RoboMotion",
      categories: ["Robotics|Welding"],
      compatibleJoints: ["J1", "J2"],
      compatibleRobotSeries: ["NexBot Vision"],
      description: "Welding cell robotic arm.",
      id: "rm-weldpro-20",
      imageUrl: "https://example.test/image-thumb.jpg",
      inStock: true,
      price: 12_500,
      promoPrice: 11_950,
      rating: 8.7,
      title: "RM WeldPro 20",
      url: "https://example.test/products/arm",
    });
  });

  it("normalizes generated regular, hierarchical, and numeric facets", () => {
    expect(
      mapHeadlessFacets([
        {
          state: {
            displayName: "Brand",
            field: "ec_brand",
            type: "regular",
            values: [
              { numberOfResults: 12, state: "selected", value: "RoboMotion" },
              { numberOfResults: 4, state: "idle", value: "NexBot" },
            ],
          },
        },
        {
          state: {
            displayName: "Category",
            field: "ec_category",
            type: "hierarchical",
            values: [
              {
                isLeafValue: true,
                numberOfResults: 5,
                path: ["Robotics", "Welding"],
                state: "idle",
                value: "Robotics|Welding",
              },
            ],
          },
        },
        {
          state: {
            displayName: "Price",
            domain: { max: 20_000, min: 1_000 },
            field: "ec_price",
            type: "numericalRange",
            values: [
              { end: 10_000, endInclusive: true, numberOfResults: 6, start: 1_000, state: "selected" },
            ],
          },
        },
      ]),
    ).toEqual([
      {
        field: "ec_brand",
        id: "ec_brand",
        label: "Brand",
        type: "regular",
        values: [
          { count: 12, label: "RoboMotion", selected: true, value: "RoboMotion" },
          { count: 4, label: "NexBot", selected: false, value: "NexBot" },
        ],
      },
      {
        field: "ec_category",
        id: "ec_category",
        label: "Category",
        type: "hierarchical",
        values: [
          {
            count: 5,
            isLeafValue: true,
            label: "Robotics|Welding",
            path: ["Robotics", "Welding"],
            selected: false,
            value: "Robotics|Welding",
          },
        ],
      },
      {
        domain: { increment: 1, max: 20_000, min: 1_000 },
        field: "ec_price",
        id: "ec_price",
        label: "Price",
        type: "numericalRange",
        values: [
          { count: 6, end: 10_000, endInclusive: true, selected: true, start: 1_000 },
        ],
      },
    ]);
  });

  it("keeps Headless Commerce pagination zero-based for existing UI components", () => {
    expect(mapHeadlessPagination({ page: 1, pageSize: 24, totalEntries: 50, totalPages: 3 })).toEqual({
      page: 1,
      perPage: 24,
      totalEntries: 50,
      totalPages: 3,
      totalProducts: 50,
    });
  });

  it("drops facets with a type it does not recognize, such as location", () => {
    expect(
      mapHeadlessFacets([
        {
          state: {
            displayName: "Store",
            field: "ec_store_location",
            type: "location",
            values: [{ numberOfResults: 3, state: "idle", value: "Toronto" }],
          },
        },
      ]),
    ).toEqual([]);
  });

  it("derives a stable id for the relevance sort criterion", () => {
    expect(getSortCriterionId({ by: "relevance" })).toBe("relevance");
  });

  it("derives a joined field:direction id for a fields sort criterion, defaulting to ascending", () => {
    expect(
      getSortCriterionId({
        by: "fields",
        fields: [{ name: "ec_price", direction: "desc" }, { name: "ec_rating" }],
      }),
    ).toBe("ec_price:desc,ec_rating:asc");
  });

  it("maps the applied and available sort criteria into ids and human-readable labels", () => {
    expect(
      mapHeadlessSort({
        appliedSort: { by: "relevance" },
        availableSorts: [
          { by: "relevance" },
          { by: "fields", fields: [{ direction: "desc", name: "ec_price" }] },
          { by: "fields", fields: [{ direction: "asc", name: "ec_rating" }] },
          { by: "fields", fields: [{ displayName: "Newest", direction: "desc", name: "ec_publish_date" }] },
          {
            by: "fields",
            fields: [
              { direction: "desc", name: "ec_price" },
              { direction: "asc", name: "ec_brand-name" },
            ],
          },
        ],
      }),
    ).toEqual({
      appliedSort: "relevance",
      availableSorts: [
        { id: "relevance", label: "Relevance" },
        { id: "ec_price:desc", label: "price (High to Low)" },
        { id: "ec_rating:asc", label: "rating (Low to High)" },
        { id: "ec_publish_date:desc", label: "Newest" },
        { id: "ec_price:desc,ec_brand-name:asc", label: "price (High to Low), brand name (Low to High)" },
      ],
    });
  });
});
