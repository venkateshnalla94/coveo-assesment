import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function checkA11y(page: import("@playwright/test").Page) {
  await expect(page).toHaveTitle(/Coveo Search Assessment/);
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
  await page.goto("/");
  await checkA11y(page);
});

test("suggestions, results, facets, generative, and trending states pass axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  await page.getByRole("combobox", { name: "Search" }).click();
  await page.getByRole("combobox", { name: "Search" }).fill("auth");
  await expect(page.getByRole("option", { name: "authentication" })).toBeVisible();
  await checkA11y(page);

  await search(page, "authentication");
  await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();
  await expect(page.getByLabel("Search filters")).toBeVisible();
  await expect(page.getByLabel("Trending content")).toBeVisible();
  await expect(page.getByLabel("Generated answer citations")).toBeVisible();
  await checkA11y(page);
});

test("zero-results and minimal profile states pass axe", async ({ page }) => {
  await page.goto("/?scenario=empty");
  await search(page, "no matching query");
  await expect(page.getByRole("heading", { name: /No results/i })).toBeVisible();
  await checkA11y(page);

  await page.goto("/?profile=minimal");
  await search(page, "digital transformation");
  await expect(page.getByRole("link", { name: /Digital transformation overview/i })).toBeVisible();
  await checkA11y(page);
});
