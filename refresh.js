import { chromium } from "playwright";

const FIGHTER_ID = "3795247575";

const CHAR_IDS_API_URL = "https://script.google.com/macros/s/AKfycbxg5BCspawKmM5m9YH0YkVS9UkU6Br2t8hZMgEZaB-vynXJ4TV7mZgb3rzRhfLq1z6m/exec";

// Rolling window in days (last 7 days)
const WINDOW_DAYS = 90;

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

async function fetchCharacterIds_() {
  const resp = await fetch(CHAR_IDS_API_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) {
    throw new Error(`CHAR IDS API failed ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();

  if (!Array.isArray(data)) {
    throw new Error(`CHAR IDS API returned non-array: ${JSON.stringify(data).slice(0, 200)}`);
  }

  // keep only positive integers
  return data
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.trunc(n));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // compute date window
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const fromUTC = new Date(todayUTC);
  fromUTC.setUTCDate(fromUTC.getUTCDate() - WINDOW_DAYS);

  const playedTo = ymdUTC_(todayUTC);
  const playedFrom = ymdUTC_(fromUTC);

  // pull characters dynamically from your sheet via Apps Script
  const characterIds = await fetchCharacterIds_();
  console.log("Character IDs from sheet:", characterIds);

  const URLS = [
    "https://sfbuff.site/",
    `https://sfbuff.site/fighters/${FIGHTER_ID}`,
    `https://sfbuff.site/fighters/${FIGHTER_ID}/matches`,
    `https://sfbuff.site/fighters/${FIGHTER_ID}/matchup_chart`,
    ...characterIds.map((cid) => rankedHistoryUrl_(cid, playedFrom, playedTo)),
  ];

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    timezoneId: "America/Chicago",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  for (const url of URLS) {
    console.log("Visiting:", url);
    await page.goto(url, { waitUntil: "networkidle" });
    await sleep(1500);
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
