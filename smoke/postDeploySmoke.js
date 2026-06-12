/**
 * Post-deploy smoke test (LIVE GitHub Pages URL).
 *
 * Minimal puppeteer check that runs AFTER the GH Pages deploy completes, against
 * the real deployed site. It is intentionally tiny and resilient: load home,
 * open one song's lyric view, toggle to music, and assert the sheet-music image
 * responds 200 image/png. This catches deploy-time regressions (blank deploy,
 * broken base path, image host issues) without re-running the full suite.
 *
 * Standalone (no jest): exits non-zero on failure so CI can gate on it.
 *
 * Usage: SMOKE_URL=https://church-life-apps.github.io/ node smoke/postDeploySmoke.js
 */
const puppeteer = require("puppeteer");

const SMOKE_URL = process.env.SMOKE_URL || "https://church-life-apps.github.io/";
const SONG = 6;

function log(...args) {
  // eslint-disable-next-line no-console
  console.log("[smoke]", ...args);
}

async function main() {
  log("target:", SMOKE_URL);
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // 1) Home loads and shows at least one songbook card.
  await page.goto(SMOKE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll(".songbookCardView").length >= 1, {
    timeout: 30000,
  });
  const origin = new URL(page.url()).origin;
  log("home OK at", origin);

  // 2) Open a song's lyric view (hash route).
  await page.goto(`${origin}/#/shl/${SONG}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    n => {
      const e = document.querySelector("#lyricViewCard > ion-card-header > ion-card-title");
      return e && (e.innerHTML || "").startsWith(`${n})`);
    },
    { timeout: 30000 },
    SONG
  );
  const title = await page.$eval("#lyricViewCard > ion-card-header > ion-card-title", e => e.innerHTML);
  log("lyric view OK:", title);

  // 3) Toggle to music view and verify the image is a real PNG (HTTP 200).
  await page.waitForSelector("#songViewToggler", { timeout: 30000 });
  await page.evaluate(() => {
    const t = document.querySelector("#songViewToggler");
    if (t) t.click();
  });
  await page.waitForSelector("#musicView", { timeout: 30000 });
  await page.waitForFunction(
    () => {
      const e = document.querySelector("#musicView");
      return e && (e.getAttribute("src") || "").includes("_006");
    },
    { timeout: 30000 }
  );
  const src = await page.$eval("#musicView", e => e.getAttribute("src"));
  const meta = await page.evaluate(async u => {
    const r = await fetch(u);
    return { status: r.status, contentType: r.headers.get("content-type") || "" };
  }, src);
  log("music image:", src, JSON.stringify(meta));

  if (meta.status !== 200 || !meta.contentType.includes("image/png")) {
    throw new Error(`Sheet-music image check failed: status=${meta.status} contentType=${meta.contentType}`);
  }

  await browser.close();
  log("SMOKE PASSED");
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error("[smoke] FAILED:", err.message);
  process.exit(1);
});
