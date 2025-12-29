import { chromium } from "playwright";

const FIGHTER_ID = "3795247575";

// You can add more character IDs later, like [28, 22] etc.
const RANKED_HISTORY_CHARACTER_IDS = [28];

// Rolling window in days (last 7 days)
const WINDOW_DAYS = 7;

function ymdUTC_(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rankedHistoryUrl_(charId, playedFrom, playedTo) {
  const qs = new URLSearchParams({
    home_character_id: String(charId),
    played_from: playedFrom,
    played_to: playedTo,
  });
  return `https://sfbuff.site/fighters/${FIGHTER_ID}/ranked_history?${qs.toString()}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Date-only params: compute "today" and "today - WINDOW_DAYS" in UTC
  // Good enough because SFBUFF uses YYYY-MM-DD without time.
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const fromUTC = new Date(todayUTC);
  fromUTC.setUTCDate(fromUTC.getUTCDate() - WINDOW_DAYS);

  const playedTo = ymdUTC_(todayUTC);
  const playedFrom = ymdUTC_(fromUTC);

  const URLS = [
    "https://sfbuff.site/",
    `https://sfbuff.site/fighters/${FIGHTER_ID}`,
    `https://sfbuff.site/fighters/${FIGHTER_ID}/matches`,
    `https://sfbuff.site/fighters/${FIGHTER_ID}/matchup_chart`,
    ...RANKED_HISTORY_CHARACTER_IDS.map((cid) =>
      rankedHistoryUrl_(cid, playedFrom, playedTo)
    ),
  ];

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

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
