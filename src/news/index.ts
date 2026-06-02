import { NaverClient, canonicalizeUrl, stripHtml } from "./naver";
import { GeminiClient } from "./gemini";
import {
  tryAddDedup,
  nextNewsId,
  storeNewsItem,
  getTodayCount,
  getTodayNewsItems,
  storeAnalysis,
  publishAnalysisEvent,
  resetDailyKeys,
} from "./redis";
import {
  registerHourlyJob,
  registerFinalJob,
  registerResetJob,
  stopAll,
} from "./scheduler";
import type { NewsItem, NewsAnalysisResult } from "./types";

let naver: NaverClient | null = null;
let gemini: GeminiClient | null = null;

function getClients(): { naver: NaverClient; gemini: GeminiClient } {
  if (!naver) naver = new NaverClient();
  if (!gemini) gemini = new GeminiClient();
  return { naver, gemini };
}

function parseKeywords(): string[] {
  return (process.env.NEWS_KEYWORDS ?? "경제,금융,주식,증시,코스피,투자")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

async function collectOnce(): Promise<number> {
  const { naver, gemini } = getClients();
  const keywords = parseKeywords();
  const display = Number(process.env.NEWS_DISPLAY_PER_KEYWORD ?? 10);
  let inserted = 0;

  for (const keyword of keywords) {
    let items;
    try {
      items = await naver.search(keyword, display);
    } catch (e) {
      console.error(`[news] naver search failed for "${keyword}":`, e);
      continue;
    }

    const rawTitles = items.map((raw) => stripHtml(raw.title));
    let relevantIndices: number[];
    try {
      relevantIndices = await gemini.filterRelevant(rawTitles);
      const filtered = items.length - relevantIndices.length;
      if (filtered > 0)
        console.log(`[news:filter] "${keyword}": ${filtered}개 제외 (${relevantIndices.length}개 관련)`);
    } catch (e) {
      console.error(`[news:filter] gemini filter failed for "${keyword}", storing all:`, e);
      relevantIndices = items.map((_, i) => i);
    }
    const relevantItems = items.filter((_, i) => relevantIndices.includes(i));

    for (const raw of relevantItems) {
      const url = raw.originallink || raw.link;
      if (!url) continue;
      const canonical = canonicalizeUrl(url);
      const fresh = await tryAddDedup(canonical);
      if (!fresh) continue;

      const newsId = await nextNewsId();
      const title = stripHtml(raw.title).slice(0, 50);
      const content = stripHtml(raw.description);
      const publishedAt = Date.parse(raw.pubDate) || Date.now();

      const item: NewsItem = {
        newsId,
        newUrl: url.slice(0, 255),
        title,
        content,
        publishedAt,
        keyword,
        fetchedAt: Date.now(),
      };
      await storeNewsItem(item);
      inserted++;
    }
  }
  return inserted;
}

async function maybeAnalyze(_force = false): Promise<boolean> {
  const target = Number(process.env.NEWS_PER_RUN ?? 30);
  const count = await getTodayCount();
  if (count === 0) return false;

  const { gemini } = getClients();
  const items = await getTodayNewsItems(target);

  let analysis;
  try {
    analysis = await gemini.analyze(items);
  } catch (e) {
    console.error("[news] gemini analyze failed:", e);
    return false;
  }

  const result: NewsAnalysisResult = {
    ...analysis,
    baseTime: new Date().toISOString(),
    newsCount: items.length,
    newsIds: items.map((i) => i.newsId),
  };
  await storeAnalysis(result);
  await publishAnalysisEvent(result);
  console.log(
    `[news] analysis stored & event published (newsCount=${items.length})`,
  );
  return true;
}

export async function triggerNewsPipelineOnce(force = false): Promise<{
  inserted: number;
  analyzed: boolean;
}> {
  const inserted = await collectOnce();
  const analyzed = await maybeAnalyze(force);
  return { inserted, analyzed };
}

export function startNewsPipeline(): void {
  registerHourlyJob(async () => {
    await collectOnce();
    await maybeAnalyze(false);
  });
  registerFinalJob(async () => {
    await collectOnce();
    await maybeAnalyze(true);
  });
  registerResetJob(async () => {
    await resetDailyKeys();
    console.log("[news:reset] today keys cleared");
  });
  console.log(
    "[news] pipeline scheduled (hourly :05, final 23:59, reset 00:00 KST)",
  );

  void (async () => {
    try {
      console.log("[news:bootstrap] initial collection start");
      const { inserted, analyzed } = await triggerNewsPipelineOnce(false);
      console.log(
        `[news:bootstrap] inserted=${inserted}, analyzed=${analyzed}`,
      );
    } catch (e) {
      console.error("[news:bootstrap] failed:", e);
    }
  })();
}

export function stopNewsPipeline(): void {
  stopAll();
}
