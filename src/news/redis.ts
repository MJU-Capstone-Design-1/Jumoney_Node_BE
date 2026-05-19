import { createHash } from "node:crypto";
import { redis } from "../websocket";
import type { NewsItem, NewsAnalysisResult } from "./types";

const KEY_SEQ = "news:seq";
const KEY_TODAY = "news:today";
const KEY_ANALYSIS_TODAY = "news:analysis:today";
const STREAM_ANALYSIS = "stream:news:analysis";

export function todayKstYmd(now = new Date()): string {
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const d = new Date(kstMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function nextMidnightKstEpoch(now = new Date()): number {
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const d = new Date(kstMs);
  const nextUtcMidnightKst = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
  );
  return Math.floor((nextUtcMidnightKst - 9 * 60 * 60 * 1000) / 1000);
}

export function urlHash(canonicalUrl: string): string {
  return createHash("sha1").update(canonicalUrl).digest("hex");
}

export function dedupKey(ymd: string = todayKstYmd()): string {
  return `news:dedup:${ymd}`;
}

export function yesterdayKstYmd(now = new Date()): string {
  return todayKstYmd(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

export async function resetDailyKeys(): Promise<void> {
  await redis.del(KEY_TODAY, KEY_ANALYSIS_TODAY, dedupKey(yesterdayKstYmd()));
}

export function itemKey(newsId: number): string {
  return `news:item:${newsId}`;
}

export async function tryAddDedup(canonicalUrl: string): Promise<boolean> {
  const key = dedupKey();
  const added = await redis.sadd(key, urlHash(canonicalUrl));
  if (added === 1) {
    await redis.expireat(key, nextMidnightKstEpoch() + 3600);
  }
  return added === 1;
}

export async function nextNewsId(): Promise<number> {
  return await redis.incr(KEY_SEQ);
}

export async function storeNewsItem(item: NewsItem): Promise<void> {
  const expire = nextMidnightKstEpoch();
  const key = itemKey(item.newsId);
  await redis
    .multi()
    .hset(key, {
      newsId: String(item.newsId),
      newUrl: item.newUrl,
      title: item.title,
      content: item.content,
      publishedAt: String(item.publishedAt),
      keyword: item.keyword,
      fetchedAt: String(item.fetchedAt),
    })
    .expireat(key, expire)
    .zadd(KEY_TODAY, item.publishedAt, String(item.newsId))
    .expireat(KEY_TODAY, expire)
    .exec();
}

export async function getTodayCount(): Promise<number> {
  return await redis.zcard(KEY_TODAY);
}

export async function hasAnalysisToday(): Promise<boolean> {
  return (await redis.exists(KEY_ANALYSIS_TODAY)) === 1;
}

export async function getTodayNewsItems(limit = 30): Promise<NewsItem[]> {
  const ids = await redis.zrange(KEY_TODAY, 0, limit - 1);
  if (ids.length === 0) return [];
  const pipeline = redis.multi();
  for (const id of ids) pipeline.hgetall(itemKey(Number(id)));
  const results = (await pipeline.exec()) ?? [];
  const items: NewsItem[] = [];
  for (const [err, raw] of results) {
    if (err || !raw) continue;
    const r = raw as Record<string, string>;
    if (!r.newsId) continue;
    items.push({
      newsId: Number(r.newsId),
      newUrl: r.newUrl,
      title: r.title,
      content: r.content,
      publishedAt: Number(r.publishedAt),
      keyword: r.keyword,
      fetchedAt: Number(r.fetchedAt),
    });
  }
  return items;
}

/**
 * 가장 최근 분석(`news:analysis:today`)이 참조한 newsIds 기준으로 뉴스 본문을 모아 반환.
 *  - 분석 결과와 1:1로 일치하는 "이번 시간의 30개"를 보장.
 *  - 응답은 publishedAt 내림차순 (프론트가 최신순으로 보여줄 수 있도록).
 */
export async function getAnalysisNewsItems(): Promise<{
  baseTime: string | null;
  newsIds: number[];
  items: NewsItem[];
}> {
  const analysis = await redis.hgetall(KEY_ANALYSIS_TODAY);
  if (!analysis || !analysis.baseTime) {
    return { baseTime: null, newsIds: [], items: [] };
  }
  const newsIds: number[] = analysis.newsIds
    ? JSON.parse(analysis.newsIds)
    : [];
  if (newsIds.length === 0) {
    return { baseTime: analysis.baseTime, newsIds: [], items: [] };
  }

  const pipeline = redis.multi();
  for (const id of newsIds) pipeline.hgetall(itemKey(id));
  const results = (await pipeline.exec()) ?? [];

  const items: NewsItem[] = [];
  for (const [err, raw] of results) {
    if (err || !raw) continue;
    const r = raw as Record<string, string>;
    if (!r.newsId) continue;
    items.push({
      newsId: Number(r.newsId),
      newUrl: r.newUrl,
      title: r.title,
      content: r.content,
      publishedAt: Number(r.publishedAt),
      keyword: r.keyword,
      fetchedAt: Number(r.fetchedAt),
    });
  }
  items.sort((a, b) => b.publishedAt - a.publishedAt);
  return { baseTime: analysis.baseTime, newsIds, items };
}

export async function storeAnalysis(result: NewsAnalysisResult): Promise<void> {
  const expire = nextMidnightKstEpoch();
  await redis
    .multi()
    .hset(KEY_ANALYSIS_TODAY, {
      baseTime: result.baseTime,
      analysisResult: result.analysisResult,
      summary: result.summary,
      reasoning: result.reasoning,
      keyword: result.keyword,
      newsCount: String(result.newsCount),
      newsIds: JSON.stringify(result.newsIds),
      goodSectors: JSON.stringify(result.goodSectors),
      badSectors: JSON.stringify(result.badSectors),
    })
    .expireat(KEY_ANALYSIS_TODAY, expire)
    .exec();
}

export async function publishAnalysisEvent(
  result: NewsAnalysisResult,
): Promise<void> {
  await redis.xadd(
    STREAM_ANALYSIS,
    "MAXLEN",
    "~",
    "1000",
    "*",
    "baseTime",
    result.baseTime,
    "newsCount",
    String(result.newsCount),
    "keyword",
    result.keyword,
  );
}
