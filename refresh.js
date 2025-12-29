import { chromium } from "playwright";

const FIGHTER_ID = "3795247575";

const URLS = [
  "https://sfbuff.site/",
  `https://sfbuff.site/fighters/${FIGHTER_ID}`,
  `https://sfbuff.site/fighters/${FIGHTER_ID}/matches`,
  `https://sfbuff.site/fighters/${FIGHTER_ID}/ranked_history`,
  `https://sfbuff.site/fighters/${FIGHTER_ID}/matchup_chart`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    timezoneId: "America/Chicago",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  for (const url of URLS) {
    await page.goto(url, { waitUntil: "networkidle" });
    await sleep(1500);
  }

  await sleep(2000);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
