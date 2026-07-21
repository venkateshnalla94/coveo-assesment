import { expect, test } from "@playwright/test";

async function search(page: import("@playwright/test").Page, query: string) {
  await expect(page.locator(".search-box-wrap[data-search-ready='true']")).toBeVisible();
  const input = page.getByRole("combobox", { name: "Search" });
  await input.click();
  await input.fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("profiles resolve distinct fixture behavior", async ({ page }) => {
  await page.goto("/?profile=developer-documentation");
  await search(page, "authentication");
  await expect(page.getByText("Developer Documentation", { exact: true })).toBeVisible();
  await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();
  await expect(page.getByRole("region", { name: "Generated answer" })).toBeVisible();

  await page.goto("/?profile=customer-support");
  await search(page, "account troubleshooting");
  await expect(page.getByText("Customer Support", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("list").getByRole("link", { name: /Login troubleshooting guide/i }).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Trending content")).toBeVisible();

  await page.goto("/?profile=ecommerce");
  await search(page, "product recommendations");
  await expect(page.getByText("Ecommerce")).toBeVisible();
  await expect(page.getByRole("link", { name: /Trail running hoodie/i })).toBeVisible();
  await expect(page.getByText("Generated answer")).toHaveCount(0);
  await expect(page.getByLabel("Sort results")).toBeVisible();

  await page.goto("/?profile=minimal");
  await search(page, "digital transformation");
  await expect(page.getByText("Minimal", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Digital transformation overview/i })).toBeVisible();
  await expect(page.getByText("Generated answer")).toHaveCount(0);
  await expect(page.getByLabel("Trending content")).toHaveCount(0);
});

test("browser back and forward restore sample URL and UI state", async ({ page }) => {
  await page.goto("/?profile=developer-documentation");
  await search(page, "authentication");
  await expect(page).toHaveURL(/q=authentication/);
  await page.getByRole("button", { name: /html/i }).click();
  await expect(page).toHaveURL(/contentType=html/);
  await expect(page.getByText(/1-4 of 4 results/i)).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/q=authentication/);
  await expect(page).not.toHaveURL(/contentType=html/);
  await expect(page.getByText(/1-4 of 5 results/i)).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/contentType=html/);
  await expect(page.getByText(/1-4 of 4 results/i)).toBeVisible();
});

test("live mode startup does not expose unsupported sample-only controls", async ({ page }) => {
  await page.goto("/?flags=live,no-generative,no-trending&profile=minimal");

  await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
  await expect(page.getByText("Generated answer")).toHaveCount(0);
  await expect(page.getByLabel("Trending content")).toHaveCount(0);
  await expect(page.getByText("Newest")).toHaveCount(0);
  await expect(page.getByText("Most Popular")).toHaveCount(0);
});
