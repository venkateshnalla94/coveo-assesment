import { expect, test } from "@playwright/test";

const viewports = [
  { height: 812, width: 375 },
  { height: 1024, width: 768 },
  { height: 768, width: 1024 },
  { height: 900, width: 1440 },
];

async function openProductDiscovery(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
}

async function search(page: import("@playwright/test").Page, query: string) {
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("keyboard interactions cover suggestions, facets, comparison, product details, and feedback", async ({ page }) => {
  await page.route("**/api/search-token", (route) => route.fulfill({ contentType: "application/json", status: 502, body: "{}" }));

  await openProductDiscovery(page);
  const input = page.getByRole("combobox", { name: "Search" });
  await expect(input).toBeEnabled();
  await input.click();
  await expect(input).toBeFocused();

  await input.fill("wel");
  await expect(page.getByRole("option").first()).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("option")).toHaveCount(0);

  await input.fill("wel");
  await expect(page.getByRole("option").first()).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.locator(".product-card").first()).toBeVisible();

  const firstFacet = page.getByLabel("Product filters").locator(".facet-value").first();
  await firstFacet.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Active product filters")).toBeVisible();

  await page.getByRole("button", { name: "Clear all" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Active product filters")).toHaveCount(0);

  const cards = page.locator(".product-card");
  await cards.nth(0).getByRole("button", { name: /Compare/i }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("1 product selected")).toBeVisible();

  await cards.nth(0).getByRole("button", { name: /View Product/i }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Product details" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Product details" })).toHaveCount(0);

  const helpful = page.getByRole("button", { name: "Helpful", exact: true });
  if ((await helpful.count()) > 0) {
    await helpful.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Feedback submitted.")).toBeVisible();
  }
});

for (const viewport of viewports) {
  test(`responsive layout remains usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openProductDiscovery(page);
    await search(page, "welding arm");
    await expect(page.getByText(/products for "welding arm"/i)).toBeVisible();
    await expect(page.getByLabel("Product filters")).toBeVisible();
    await expect(page.getByLabel("Product guidance and resources")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    const searchBox = await page.getByRole("combobox", { name: "Search" }).boundingBox();
    expect(searchBox?.width ?? 0).toBeGreaterThan(150);

    const searchButton = await page.getByRole("button", { name: "Search", exact: true }).boundingBox();
    expect(searchButton?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(searchButton?.width ?? 0).toBeGreaterThanOrEqual(40);
  });
}
