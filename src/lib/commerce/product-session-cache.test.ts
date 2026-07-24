import { afterEach, describe, expect, it } from "vitest";

import type { ProductResult } from "@/features/commerce/models/commerce-models";
import { readProductForPdp, storeProductForPdp } from "@/lib/commerce/product-session-cache";

const product: ProductResult = {
  categories: [],
  compatibleJoints: [],
  compatiblePartsSkus: [],
  compatibleRobotSeries: [],
  compatibleRobots: [],
  description: "A product",
  id: "PROD-1",
  images: [],
  title: "Product One",
};

afterEach(() => {
  window.sessionStorage.clear();
});

describe("product-session-cache", () => {
  it("round-trips a product through sessionStorage keyed by pdp-product:<id>", () => {
    storeProductForPdp(product);

    expect(window.sessionStorage.getItem(`pdp-product:${product.id}`)).toBe(JSON.stringify(product));
    expect(readProductForPdp(product.id)).toEqual(product);
  });

  it("returns undefined when nothing is stored for the id", () => {
    expect(readProductForPdp("missing-id")).toBeUndefined();
  });

  it("falls back silently when sessionStorage.setItem throws", () => {
    const original = window.sessionStorage.setItem;
    window.sessionStorage.setItem = () => {
      throw new Error("quota exceeded");
    };

    expect(() => storeProductForPdp(product)).not.toThrow();

    window.sessionStorage.setItem = original;
  });

  it("falls back silently when sessionStorage.getItem throws", () => {
    const original = window.sessionStorage.getItem;
    window.sessionStorage.getItem = () => {
      throw new Error("storage unavailable");
    };

    expect(readProductForPdp(product.id)).toBeUndefined();

    window.sessionStorage.getItem = original;
  });
});
