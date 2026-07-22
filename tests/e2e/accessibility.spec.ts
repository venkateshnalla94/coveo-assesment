import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function checkA11y(page: import("@playwright/test").Page) {
  await expect(page).toHaveTitle(/RoboMotion Industries Product Discovery/);
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const seriousViolations = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  expect(seriousViolations).toEqual([]);
}

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

test("default RoboMotion page has no serious accessibility violations", async ({ page }) => {
  await page.route("**/api/search-token", (route) =>
    route.fulfill({ contentType: "application/json", status: 502, body: "{}" }),
  );

  await openProductDiscovery(page);
  await expect(page.locator(".product-card").first()).toBeVisible();
  await expect(page.getByText(/Showing 1-24 of .* products/i)).toBeVisible();
  await checkA11y(page);
});

test("suggestions, product results, facets, RGA, and details pass axe", async ({ page }) => {
  await page.route("**/api/search-token", (route) => route.fulfill({ contentType: "application/json", status: 502, body: "{}" }));

  await openProductDiscovery(page);
  await page.getByRole("combobox", { name: "Search" }).click();
  await page.getByRole("combobox", { name: "Search" }).fill("wel");
  await expect(page.getByRole("option").first()).toBeVisible();
  await checkA11y(page);

  await search(page, "welding arm");
  await expect(page.getByText(/products for "welding arm"/i)).toBeVisible();
  await expect(page.getByLabel("Product filters")).toBeVisible();
  await expect(page.getByLabel("Technical Resources")).toBeVisible();
  await checkA11y(page);

  const readMore = page.getByRole("button", { name: "Read full guidance and citations" });
  if ((await readMore.count()) > 0) {
    await readMore.click();
    await page.getByRole("tab", { name: /Citations/ }).click();
    await expect(page.getByLabel("Generated answer citations")).toBeVisible();
    await checkA11y(page);
    await page.getByRole("button", { name: "Close AI product guidance" }).click();
  }

  await page.locator(".product-card").nth(0).getByRole("button", { name: /View Product/i }).click();
  await expect(page.getByRole("dialog", { name: "Product details" })).toBeVisible();
  await checkA11y(page);
});

test("isolated RGA and technical resource errors pass axe", async ({ page }) => {
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
  await checkA11y(page);
});
