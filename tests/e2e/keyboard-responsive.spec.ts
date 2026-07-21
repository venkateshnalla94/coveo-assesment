import { expect, test } from "@playwright/test";

const viewports = [
  { height: 812, width: 375 },
  { height: 1024, width: 768 },
  { height: 768, width: 1024 },
  { height: 900, width: 1440 },
];

async function search(page: import("@playwright/test").Page, query: string) {
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("keyboard interactions cover suggestions, facets, sorting, pagination, citations, feedback, and retry", async ({ page }) => {
  await page.goto("/?scenario=generative");
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.focus();
  await expect(input).toBeFocused();

  await input.click();
  await input.fill("auth");
  await expect(page.getByRole("option", { name: "authentication" })).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("option", { name: "authentication" })).toHaveCount(0);

  await input.fill("auth");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(/q=authentication/);

  await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "2", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".results-column")).toBeFocused();

  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: /html/i }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/contentType=html/);

  await page.getByLabel("Sort results").focus();
  await page.getByLabel("Sort results").selectOption("newest");
  await expect(page).toHaveURL(/sort=newest/);

  await page.goto("/");
  await search(page, "authentication");
  await expect(
    page.getByLabel("Generated answer citations").getByRole("link", { name: /Authenticated search token guide/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Helpful", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Feedback submitted.")).toBeVisible();

  await page.goto("/?scenario=error");
  await search(page, "authentication");
  await expect(page.locator(".inline-error[role='alert']")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".inline-error[role='alert']")).toBeVisible();
});

for (const viewport of viewports) {
  test(`responsive layout remains usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await search(page, "authentication");
    await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();
    await expect(page.getByLabel("Search filters")).toBeVisible();
    await expect(page.getByLabel("Trending content")).toBeVisible();
    await expect(page.getByLabel("Generated answer citations")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    const searchBox = await page.getByRole("combobox", { name: "Search" }).boundingBox();
    expect(searchBox?.width ?? 0).toBeGreaterThan(160);

    const searchButton = await page.getByRole("button", { name: "Search", exact: true }).boundingBox();
    const nextPageButton = await page.getByRole("button", { name: "Next page" }).boundingBox();
    expect(searchButton?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(searchButton?.width ?? 0).toBeGreaterThanOrEqual(40);
    expect(nextPageButton?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(nextPageButton?.width ?? 0).toBeGreaterThanOrEqual(40);
  });
}
