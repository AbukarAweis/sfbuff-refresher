import { chromium } from "playwright";

const FIGHTER_ID = "3795247575";
const URL = `https://sfbuff.site/fighters/${FIGHTER_ID}/matches`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    timezoneId: "America/Chicago",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  await page.goto("https://sfbuff.site/", { waitUntil: "domcontentloaded" });
  await page.goto(URL, { waitUntil: "networkidle" });

  await sleep(4000);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
