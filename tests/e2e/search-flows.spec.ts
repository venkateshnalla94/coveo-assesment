import { expect, test } from "@playwright/test";

async function gotoSample(page: import("@playwright/test").Page, params = "") {
  await page.goto(`/${params}`);
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Search" })).toBeVisible();
}

async function runSearch(page: import("@playwright/test").Page, query: string) {
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("basic search reflects query in URL and renders result cards", async ({ page }) => {
  await gotoSample(page);
  await runSearch(page, "authentication");

  await expect(page).toHaveURL(/q=authentication/);
  await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();
  const resultStack = page.locator(".result-stack");
  await expect(resultStack.getByRole("link")).toHaveCount(4);

  const firstResult = resultStack.getByRole("link").first();
  await expect(firstResult).toHaveAttribute("href", /example\.coveo\.local\/docs-/);
});

test("suggestions can be selected with keyboard", async ({ page }) => {
  await gotoSample(page);
  const input = page.getByRole("combobox", { name: "Search" });

  await input.click();
  await input.fill("auth");
  await expect(page.getByRole("option", { name: "authentication" })).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");

  await expect(page).toHaveURL(/q=authentication/);
  await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();
});

test("facets, sorting, and clearing filters update URL and results", async ({ page }) => {
  await gotoSample(page);
  await runSearch(page, "authentication");

  await page.getByRole("button", { name: /html/i }).click();
  await expect(page).toHaveURL(/contentType=html/);
  await expect(page.getByText(/1-4 of 4 results/i)).toBeVisible();

  await page.getByLabel("Sort results").selectOption("newest");
  await expect(page).toHaveURL(/sort=newest/);

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).not.toHaveURL(/contentType=html/);
});

test("pagination updates active page and supports returning to page one", async ({ page }) => {
  await gotoSample(page);
  await runSearch(page, "authentication");

  await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("navigation", { name: "Pagination" }).locator("[aria-current='page']"),
  ).toHaveText("2");

  await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "1", exact: true }).click();
  await expect(page).not.toHaveURL(/page=2/);
  await expect(
    page.getByRole("navigation", { name: "Pagination" }).locator("[aria-current='page']"),
  ).toHaveText("1");
});

test("zero results recover through suggested query", async ({ page }) => {
  await gotoSample(page);
  await runSearch(page, "no matching query");

  await expect(page.getByRole("heading", { name: /No results/i })).toBeVisible();
  await page.getByRole("button", { name: "digital transformation" }).click();
  await expect(page).toHaveURL(/q=digital\+transformation/);
});

test("generative answer renders citations and accepts positive feedback", async ({ page }) => {
  await gotoSample(page, "?scenario=generative");
  await runSearch(page, "authentication");

  await expect(page.getByText(/Generating answer for authentication/i)).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  await runSearch(page, "authentication");
  await expect(page.getByText(/short-lived token from the server/i)).toBeVisible();
  await expect(
    page.getByLabel("Generated answer citations").getByRole("link", { name: /Authenticated search token guide/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Helpful", exact: true }).click();
  await expect(page.getByText("Feedback submitted.")).toBeVisible();
});

test("generative errors remain isolated and retryable", async ({ page }) => {
  await gotoSample(page, "?scenario=generative-error");
  await runSearch(page, "authentication");

  await expect(page.getByText(/Generated answer could not be loaded/i)).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText(/Generated answer could not be loaded/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Authenticated search token guide/i })).toBeVisible();
});
