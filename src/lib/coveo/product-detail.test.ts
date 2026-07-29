import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchProductDetail, mapRawProductDetail } from "@/lib/coveo/product-detail";

// Mirrors the live Search API `raw` shape for permanentid NXB-GEN-822-004 (trimmed to the fields
// the mapper reads), including the mixed array vs ";"-joined-string multi-value conventions.
const rawResult = {
  title: "NexBot Robotics 822-004 Aramid Fiber Arm Sleeve for Industrial Robots",
  clickUri: "https://robotics.barca.group/p/NXB-GEN-822-004",
  raw: {
    ec_product_id: "NXB-GEN-822-004",
    permanentid: "NXB-GEN-822-004",
    ec_name: "NexBot Robotics 822-004 Aramid Fiber Arm Sleeve for Industrial Robots",
    ec_shortdesc: "Durable aramid fiber sleeve.",
    ec_description: "The NexBot Robotics 822-004 Protective Arm Sleeve is an industrial-grade cover.",
    ec_brand: "NexBot Robotics",
    ec_category: ["Accessories & Mounting", "Accessories & Mounting|Covers & Shields"],
    ec_images: ["https://images.barca.group/robotics/NXB-GEN-822-004/NXB-GEN-822-004_515x515.jpg"],
    ec_thumbnails: ["https://images.barca.group/robotics/NXB-GEN-822-004/NXB-GEN-822-004_300x300.jpg"],
    ec_price: 725.5,
    ec_rating: 4,
    ec_in_stock: true,
    ec_item_group_id: "NXB-GEN-822",
    ec_sku: "NXB-GEN-822-004",
    country_of_origin: "JP",
    cat_total_reviews: 3,
    is_new: false,
    is_discontinued: false,
    compatible_robot_series: "R-20",
    compatible_with_robots: "R-20",
    compatible_with_joints: "J1;J2;J3;J4;J5;J6",
    eng_payload: "50 kg",
    eng_reach: "1,800 mm",
    eng_ip_rating: "IP67",
    eng_material: "Aramid Fiber with Polyurethane Coating",
    eng_weight: "1.5 kg",
    eng_axes: "6",
    eng_protocol: "PROFINET",
    eng_repeatability: "±0.05 mm",
    stores_inventory: "US-MIDWEST;EU-CENTRAL;CA-EAST",
    recommended_with: "NXB-GEN-731-003;NXB-GBX-732-003",
    fitment_parent_skus: "NXB-ROB-LA013-001;NXB-ROB-LA013-003",
  },
};

describe("mapRawProductDetail", () => {
  it("maps the comprehensive indexed record into a rich ProductDetail", () => {
    const detail = mapRawProductDetail(rawResult, "fallback-id");

    expect(detail).toBeDefined();
    expect(detail?.id).toBe("NXB-GEN-822-004");
    expect(detail?.title).toContain("Aramid Fiber Arm Sleeve");
    expect(detail?.brand).toBe("NexBot Robotics");
    expect(detail?.price).toBe(725.5);
    expect(detail?.rating).toBe(4);
    expect(detail?.inStock).toBe(true);
    expect(detail?.sku).toBe("NXB-GEN-822-004");
    expect(detail?.countryOfOrigin).toBe("JP");
    expect(detail?.reviewCount).toBe(3);
    expect(detail?.isNew).toBe(false);
    expect(detail?.isDiscontinued).toBe(false);
    expect(detail?.imageUrl).toContain("_300x300.jpg");
    expect(detail?.categories).toEqual([
      "Accessories & Mounting",
      "Accessories & Mounting|Covers & Shields",
    ]);
    expect(detail?.providerMetadata?.permanentId).toBe("NXB-GEN-822-004");
  });

  it("builds an ordered specifications table from the eng_* fields", () => {
    const detail = mapRawProductDetail(rawResult, "fallback-id");

    expect(detail?.specifications).toEqual([
      { label: "Payload", value: "50 kg" },
      { label: "Reach", value: "1,800 mm" },
      { label: "Repeatability", value: "±0.05 mm" },
      { label: "Axes", value: "6" },
      { label: "Protocol", value: "PROFINET" },
      { label: "IP Rating", value: "IP67" },
      { label: "Material", value: "Aramid Fiber with Polyurethane Coating" },
      { label: "Weight", value: "1.5 kg" },
    ]);
  });

  it("splits the ';'-joined multi-value fields absent from the Commerce payload", () => {
    const detail = mapRawProductDetail(rawResult, "fallback-id");

    expect(detail?.availabilityRegions).toEqual(["US-MIDWEST", "EU-CENTRAL", "CA-EAST"]);
    expect(detail?.recommendedSkus).toEqual(["NXB-GEN-731-003", "NXB-GBX-732-003"]);
    expect(detail?.fitmentParentSkus).toEqual(["NXB-ROB-LA013-001", "NXB-ROB-LA013-003"]);
    expect(detail?.compatibleJoints).toEqual(["J1", "J2", "J3", "J4", "J5", "J6"]);
  });

  it("falls back to cat_review_score for rating and to fallbackId when ids are missing", () => {
    const detail = mapRawProductDetail(
      { raw: { ec_name: "Untitled", cat_review_score: 5 } },
      "route-param-id",
    );

    expect(detail?.rating).toBe(5);
    expect(detail?.id).toBe("route-param-id");
    expect(detail?.specifications).toEqual([]);
    expect(detail?.availabilityRegions).toEqual([]);
  });

  it("returns undefined when the record has no title/name", () => {
    expect(mapRawProductDetail({ raw: { ec_price: 10 } }, "id")).toBeUndefined();
    expect(mapRawProductDetail(null, "id")).toBeUndefined();
  });
});

describe("fetchProductDetail", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.COVEO_ORGANIZATION_ID = "test-org";
    process.env.COVEO_PLATFORM_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns a mapped product when the Search API responds with a result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [rawResult] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const detail = await fetchProductDetail("NXB-GEN-822-004");

    expect(detail?.id).toBe("NXB-GEN-822-004");
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.aq).toContain('@permanentid=="NXB-GEN-822-004"');
    expect(body.aq).toContain('@ec_product_id=="NXB-GEN-822-004"');
    // Never leak the platform key beyond the Authorization header.
    expect(init.headers.Authorization).toBe("Bearer test-key");
  });

  it("escapes quotes in the id before interpolating into the query", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchProductDetail('evil" OR @foo=="bar');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.aq).toContain('evil\\" OR @foo==\\"bar');
  });

  it("returns undefined when there are no results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }));
    expect(await fetchProductDetail("missing")).toBeUndefined();
  });

  it("returns undefined on a non-ok upstream response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    expect(await fetchProductDetail("NXB-GEN-822-004")).toBeUndefined();
  });

  it("returns undefined when the upstream fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchProductDetail("NXB-GEN-822-004")).toBeUndefined();
  });

  it("returns undefined (no throw) when the platform key is not configured", async () => {
    delete process.env.COVEO_PLATFORM_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchProductDetail("NXB-GEN-822-004")).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
