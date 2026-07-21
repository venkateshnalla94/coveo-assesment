import { describe, expect, it } from "vitest";

import { mapCommerceSearchResponse } from "@/features/commerce/mappers/commerce-response-mapper";

describe("mapCommerceSearchResponse", () => {
  it("maps confirmed Commerce product fields and facets", () => {
    const response = mapCommerceSearchResponse({
      facets: [
        {
          displayName: "Category",
          facetId: "ec_category",
          field: "ec_category",
          type: "hierarchical",
          values: [{ numberOfResults: 2, path: ["Robots"], value: "Robots" }],
        },
        {
          displayName: "Price",
          domain: { increment: 0, max: 100, min: 10 },
          facetId: "ec_price",
          field: "ec_price",
          type: "numericalRange",
          values: [{ end: 100, endInclusive: true, numberOfResults: 2, start: 10 }],
        },
      ],
      pagination: { page: 0, perPage: 24, totalEntries: 2, totalPages: 1, totalProducts: 2 },
      products: [
        {
          additionalFields: {
            compatible_parts_skus: "P1;P2",
            compatible_robot_series: "C-10;R-20",
            compatible_with_joints: "J1;J2",
            compatible_with_robots: "C-10",
          },
          clickUri: "https://robotics.example/p/1",
          ec_brand: "NexBot Robotics",
          ec_category: ["Robots", "Robots|Collaborative Robots"],
          ec_description: "Full description",
          ec_images: ["https://example.com/image.jpg"],
          ec_in_stock: true,
          ec_name: "Collaborative Robot",
          ec_price: 18500,
          ec_product_id: "NXB-1",
          ec_rating: 4.2,
          ec_shortdesc: "Short description",
          ec_thumbnails: ["https://example.com/thumb.jpg"],
          permanentid: "NXB-1",
          resultType: "product",
        },
      ],
      sort: { appliedSort: { sortCriteria: "relevance" }, availableSorts: [{ sortCriteria: "relevance" }] },
    });

    expect(response.products[0]).toMatchObject({
      brand: "NexBot Robotics",
      compatibleRobotSeries: ["C-10", "R-20"],
      id: "NXB-1",
      imageUrl: "https://example.com/thumb.jpg",
      price: 18500,
      rating: 4.2,
      title: "Collaborative Robot",
    });
    expect(response.facets.map((facet) => facet.field)).toEqual(["ec_category", "ec_price"]);
    expect(response.availableSorts).toEqual(["relevance"]);
  });

  it("handles malformed Commerce data without throwing", () => {
    const response = mapCommerceSearchResponse({ products: [{ ec_price: "bad" }], facets: [{}] });

    expect(response.products[0]).toMatchObject({
      categories: [],
      compatibleRobotSeries: [],
      description: "",
      id: "commerce-product-1",
      title: "Untitled product",
    });
    expect(response.facets).toEqual([]);
  });
});
