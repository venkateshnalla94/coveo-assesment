// Captures reference screenshots of every documented UI state into docs/screenshots/.
// Requires a dev server already running at BASE_URL (default http://localhost:3000).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "screenshots",
);
const VIEWPORT = { width: 1440, height: 900 };
const QUERY = "welding arm";

mkdirSync(OUT_DIR, { recursive: true });

async function readySearchBox(page) {
  await page
    .locator(".search-box-wrap[data-search-ready='true']")
    .waitFor({ state: "visible" });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`captured ${name}.png`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  // 1. Home, empty search
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await readySearchBox(page);
  await shot(page, "01-home-empty-search");

  // 2. Search suggestions dropdown
  await page.getByRole("combobox", { name: "Search" }).fill("wel");
  await page
    .locator(".suggestions button[role='option']")
    .first()
    .waitFor({ state: "visible" });
  await shot(page, "02-search-suggestions");
  await page.keyboard.press("Escape");

  // 3/4/5/6. Catalog with results, generative answer, facets, trending
  await page.goto(`${BASE_URL}/catalog?q=${encodeURIComponent(QUERY)}`, {
    waitUntil: "domcontentloaded",
  });
  await readySearchBox(page);
  await page.locator(".product-card").first().waitFor({ state: "visible" });
  await page.getByLabel("Generated answer").waitFor({ state: "visible" });
  await page
    .getByLabel("Product guidance and resources")
    .waitFor({ state: "visible" });
  await page
    .getByRole("button", { name: "Regenerate answer" })
    .waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(2_000); // let the typewriter preview finish rendering
  await shot(page, "03-catalog-results");
  await shot(page, "04-generative-answer");
  await shot(page, "07-trending-content");

  // Facet toggle -> active filters
  await page
    .getByLabel("Product filters")
    .locator(".facet-value")
    .first()
    .click();
  await page.getByLabel("Active product filters").waitFor({ state: "visible" });
  await shot(page, "05-facets-toggle");
  await page.getByRole("button", { name: "Clear all" }).click();

  // 8. Quick view
  await page
    .locator(".product-card")
    .first()
    .getByRole("button", { name: /Quick view product/i })
    .click();
  await page.getByRole("dialog", { name: "Product details" }).waitFor({ state: "visible" });
  await shot(page, "08-quick-view");
  await page.getByRole("button", { name: "Close product details" }).click();

  // 9. Compare products
  const cards = page.locator(".product-card");
  await cards.nth(0).getByRole("button", { name: /Compare/i }).click();
  await cards.nth(1).getByRole("button", { name: /Compare/i }).click();
  await page.getByRole("button", { name: /Compare \(2\)/ }).click();
  await page.getByRole("dialog", { name: "Compare products" }).waitFor({ state: "visible" });
  await shot(page, "09-compare-products");
  await page.getByRole("button", { name: "Close comparison" }).click();

  // 10. Chat bot opened
  await page
    .getByRole("button", { name: "Open conversational search assistant" })
    .click();
  await page
    .getByRole("dialog", { name: "Conversational search assistant" })
    .waitFor({ state: "visible" });
  await shot(page, "10-chatbot-opened");
  await page.getByRole("button", { name: "Close conversational search assistant" }).click();

  // 6. Blog index + detail
  await page.goto(`${BASE_URL}/blog`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Blogs" }).waitFor({ state: "visible" });
  await shot(page, "06-blog-index");
  await page.locator(".blog-index-card").first().click();
  await page.waitForLoadState("domcontentloaded");
  await shot(page, "06-blog-detail");

  await browser.close();
  console.log(`Screenshots written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
