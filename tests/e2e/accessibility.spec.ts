import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function checkA11y(page: import("@playwright/test").Page) {
  await expect(page).toHaveTitle(/RoboMotion Industries Product Discovery/);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const seriousViolations = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  expect(seriousViolations).toEqual([]);
}

async function search(page: import("@playwright/test").Page, query: string) {
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("default search page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/?profile=industrial-product-discovery");
  await checkA11y(page);
});

test("suggestions, results, facets, generative, and trending states pass axe", async ({ page }) => {
  await page.goto("/?profile=industrial-product-discovery");
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  await page.getByRole("combobox", { name: "Search" }).click();
  await page.getByRole("combobox", { name: "Search" }).fill("wel");
  await expect(page.getByRole("option", { name: "welding arm" })).toBeVisible();
  await checkA11y(page);

  await search(page, "welding arm");
  await expect(page.getByText(/products for "welding arm"/i)).toBeVisible();
  await expect(page.getByLabel("Product filters")).toBeVisible();
  await expect(page.getByLabel("Technical Resources")).toBeVisible();
  await page.getByRole("button", { name: "Read full guidance and citations" }).click();
  await page.getByRole("tab", { name: /Citations/ }).click();
  await expect(page.getByLabel("Generated answer citations")).toBeVisible();
  await checkA11y(page);
  await page.getByRole("button", { name: "Close AI product guidance" }).click();

  await page.locator(".product-card").nth(0).getByRole("button", { name: /Compare/i }).click();
  await page.locator(".product-card").nth(0).getByRole("button", { name: /View Product/i }).click();
  await expect(page.getByRole("dialog", { name: "Product details" })).toBeVisible();
  await checkA11y(page);
});

test("zero-results and minimal profile states pass axe", async ({ page }) => {
  await page.goto("/?scenario=empty&profile=developer-documentation");
  await search(page, "no matching query");
  await expect(page.getByRole("heading", { name: /No results/i })).toBeVisible();
  await checkA11y(page);

  await page.goto("/?profile=minimal");
  await search(page, "digital transformation");
  await expect(page.getByRole("link", { name: /Digital transformation overview/i })).toBeVisible();
  await checkA11y(page);
});
