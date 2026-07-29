import { expect, test } from "@playwright/test";

// The product used throughout — a real permanentid in the RoboMotion commerce index.
const PRODUCT_ID = "NXB-GEN-822-004";

test("a product detail page is linkable — direct navigation renders the product with no catalog visit", async ({
  page,
}) => {
  // Straight to the PDP URL: no catalog, so no sessionStorage hand-off. Before the server-side
  // lookup this showed only the "unavailable" empty state; now it must render the real product.
  await page.goto(`/products/${PRODUCT_ID}`, { waitUntil: "domcontentloaded" });

  await expect(page.locator("article.pdp")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("822-004");
  await expect(page.getByText("Product details unavailable")).toHaveCount(0);
});

test("the server-fetched PDP surfaces comprehensive detail absent from the Commerce listing payload", async ({
  page,
}) => {
  await page.goto(`/products/${PRODUCT_ID}`, { waitUntil: "domcontentloaded" });

  // Engineering spec sheet — these fields exist only on the full indexed record, not in the
  // Commerce API response the catalog cards use.
  await expect(page.getByRole("heading", { name: "Specifications" })).toBeVisible();
  await expect(page.getByText("IP Rating")).toBeVisible();
  await expect(page.getByText("Availability")).toBeVisible();
});

test("survives a page refresh — server render does not depend on client session state", async ({ page }) => {
  await page.goto(`/products/${PRODUCT_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("article.pdp")).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("article.pdp")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("822-004");
});

test("an unknown product id degrades to the empty state, not a crash", async ({ page }) => {
  await page.goto("/products/DOES-NOT-EXIST-000", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Product details unavailable")).toBeVisible();
  await expect(page.getByRole("link", { name: /Back to catalog/i })).toBeVisible();
});
