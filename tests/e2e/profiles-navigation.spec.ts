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

for (const profile of ["developer-documentation", "customer-support", "ecommerce", "minimal"]) {
  test(`legacy ${profile} profile parameter does not switch the active assessment app`, async ({ page }) => {
    await page.route("**/api/search-token", (route) =>
      route.fulfill({ contentType: "application/json", status: 502, body: "{}" }),
    );

    await openProductDiscovery(page, `/?profile=${profile}&scenario=empty`);
    await expect(page.getByRole("banner").getByText("RoboMotion Industries", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Product filters")).toBeVisible();
    await expect(page.getByText("Developer Documentation", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Customer Support", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Ecommerce", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Minimal", { exact: true })).toHaveCount(0);
  });
}

test("browser back and forward preserve the single RoboMotion application scope", async ({ page }) => {
  await openProductDiscovery(page);
  await search(page, "welding arm");
  await expect(page.getByText(/products for "welding arm"/i)).toBeVisible();

  await openProductDiscovery(page, "/?profile=developer-documentation&scenario=error");
  await expect(page.getByRole("banner").getByText("RoboMotion Industries", { exact: true })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("banner").getByText("RoboMotion Industries", { exact: true })).toBeVisible();

  await page.goForward();
  await expect(page.getByRole("banner").getByText("RoboMotion Industries", { exact: true })).toBeVisible();
});
