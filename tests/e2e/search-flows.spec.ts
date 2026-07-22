import { expect, test } from "@playwright/test";

async function openProductDiscovery(page: import("@playwright/test").Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
}

async function search(page: import("@playwright/test").Page, query: string) {
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("RoboMotion product discovery opens directly and returns products", async ({ page }) => {
  await openProductDiscovery(page);
  await expect(page).toHaveTitle(/RoboMotion Industries Product Discovery/);
  await expect(page.getByRole("banner").getByText("RoboMotion Industries", { exact: true })).toBeVisible();

  await search(page, "welding arm");
  await expect(page.getByText(/products for "welding arm"/i)).toBeVisible();
  await expect(page.locator(".product-card").first()).toBeVisible();
  expect(await page.locator(".product-card").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByLabel("Product filters")).toBeVisible();
  await expect(page.getByLabel("Product guidance and resources")).toBeVisible();
});

test("facets, pagination, comparison, and product details work together", async ({ page }) => {
  await openProductDiscovery(page);
  await search(page, "welding arm");

  const cards = page.locator(".product-card");
  await expect(cards.first()).toBeVisible();

  const firstFacetValue = page.getByLabel("Product filters").locator(".facet-value").first();
  await firstFacetValue.click();
  await expect(page.getByLabel("Active product filters")).toBeVisible();

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByLabel("Active product filters")).toHaveCount(0);

  const pagination = page.getByRole("navigation", { name: "Pagination" });
  if ((await pagination.count()) > 0) {
    await pagination.getByRole("button", { name: "2", exact: true }).click();
    await expect(pagination.locator("[aria-current='page']")).toHaveText("2");
  }

  await cards.nth(0).getByRole("button", { name: /Compare/i }).click();
  await cards.nth(1).getByRole("button", { name: /Compare/i }).click();
  await cards.nth(2).getByRole("button", { name: /Compare/i }).click();
  await expect(page.getByText("3 products selected")).toBeVisible();
  await expect(cards.nth(3).getByRole("button", { name: /Compare/i })).toBeDisabled();

  await page.getByRole("button", { name: "Compare (3)" }).click();
  await expect(page.getByRole("dialog", { name: "Compare products" })).toBeVisible();
  await page.getByRole("button", { name: "Close comparison" }).click();

  await cards.nth(0).getByRole("button", { name: /View Product/i }).click();
  await expect(page.getByRole("dialog", { name: "Product details" })).toBeVisible();
  await page.getByRole("button", { name: "Close product details" }).click();
});

test("RGA and technical resources failures do not break product discovery", async ({ page }) => {
  let rgaCalled = false;
  let resourcesCalled = false;

  await page.route("**/api/coveo/generative/answer", (route) =>
    {
      rgaCalled = true;
      return route.fulfill({ contentType: "application/json", status: 500, body: JSON.stringify({ error: "failed" }) });
    },
  );
  await page.route("**/api/coveo/content/search", (route) =>
    {
      resourcesCalled = true;
      return route.fulfill({ contentType: "application/json", status: 500, body: JSON.stringify({ error: "failed" }) });
    },
  );

  await openProductDiscovery(page);
  await search(page, "welding arm");

  await expect(page.locator(".product-card").first()).toBeVisible();
  expect(rgaCalled).toBe(true);
  expect(resourcesCalled).toBe(true);
});
