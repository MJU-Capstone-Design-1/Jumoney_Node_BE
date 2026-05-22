import Redis from "ioredis";
import dotenv from "dotenv";
import type { Response } from "express";

dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
  throw new Error(
    "REDIS_HOST, REDIS_PORT, REDIS_PASSWORD 환경변수가 모두 필요합니다. .env 파일을 확인하세요.",
  );
}

export const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
});

redis.on("error", (err) => console.error("❌ Redis 연결 에러:", err));

// 종목코드 → 연결된 SSE 클라이언트
export const sseClients = new Map<string, Set<Response>>();

export function broadcast(code: string, data: unknown): void {
  const clients = sseClients.get(code);
  if (!clients?.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

/**
 * KIS 실시간 시세 프레임 파서.
 *
 * KIS WebSocket 텍스트 프레임 포맷 (체결 통보 H0STCNT0 기준):
 *   `0|H0STCNT0|001|<body>` 또는 `1|H0STCNT0|001|<body>`
 *   body 는 `^` 구분자: [0]종목코드, [1]시간, [2]현재가, [4]전일대비, [5]등락률, [12]누적거래량
 */
export function parseKisTick(msg: string): Record<string, unknown> | null {
  if (!msg.startsWith("0") && !msg.startsWith("1")) return null;
  const parts = msg.split("|");
  if (parts.length < 4 || !parts[3]) return null;
  const body = parts[3].split("^");
  if (body.length < 18) return null;

  const price = parseInt(body[2], 10);
  const change = parseInt(body[4], 10);
  const rate = parseFloat(body[5]);
  const vol = parseInt(body[12], 10);
  const strength = parseFloat(body[17]);

  if (
    isNaN(price) ||
    isNaN(change) ||
    isNaN(rate) ||
    isNaN(vol) ||
    isNaN(strength)
  )
    return null;

  return {
    code: body[0], // 종목코드
    time: body[1], // 시간
    price, // 현재가
    change, // 전일대비
    rate, // 등락률
    vol, // 누적거래량
    strength, // 체결강도 (CTTR)
  };
}

interface MinuteCandle {
  code: string;
  minuteTs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  rate: number;
  strength: number;
}

// 종목코드 → 현재 분봉 상태 (인메모리 집계)
const currentCandles = new Map<
  string,
  { candle: MinuteCandle; memberStr: string }
>();

// 종목코드 → 직전 누적거래량 (분봉 volume 델타 계산용)
const lastCumVol = new Map<string, number>();

const LATEST_TTL_SECONDS = 3 * 24 * 60 * 60;
const CANDLE_WINDOW_MS = 40 * 60_000;
const CANDLE_KEY_TTL_SECONDS = 60 * 60;

/**
 * 틱 1건을 수신해 분봉(1분 OHLCV)으로 집계한 뒤 Redis에 적재.
 *  - ZSET  stock:minute-candles:{code} (1일 윈도우, score = 분 시작 ms)
 *  - STRING stock:latest:{code}        (TTL 3일, 현재 분봉 갱신마다 덮어씀)
 *  - SSE 구독자에게 현재 분봉 broadcast.
 */
export async function recordToRedis(
  parsedData: Record<string, unknown>,
): Promise<void> {
  const code = String(parsedData.code ?? "");
  const price = Number(parsedData.price);
  const change = Number(parsedData.change);
  const rate = Number(parsedData.rate);
  const vol = Number(parsedData.vol);
  const strength = Number(parsedData.strength);

  const now = Date.now();
  const minuteTs = Math.floor(now / 60_000) * 60_000;

  const prevCumVol = lastCumVol.get(code);
  const tickVolDelta =
    prevCumVol === undefined ? 0 : Math.max(0, vol - prevCumVol);
  lastCumVol.set(code, vol);

  const existing = currentCandles.get(code);
  let candle: MinuteCandle;

  if (existing && existing.candle.minuteTs === minuteTs) {
    candle = existing.candle;
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    candle.volume += tickVolDelta;
    candle.change = change;
    candle.rate = rate;
    candle.strength = strength;
  } else {
    candle = {
      code,
      minuteTs,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: tickVolDelta,
      change,
      rate,
      strength,
    };
  }

  const candleKey = `stock:minute-candles:${code}`;
  const latestKey = `stock:latest:${code}`;
  const newMemberStr = JSON.stringify(candle);

  const pipeline = redis.multi();
  if (existing) pipeline.zrem(candleKey, existing.memberStr);
  pipeline.zadd(candleKey, minuteTs, newMemberStr);
  pipeline.zremrangebyscore(candleKey, 0, minuteTs - CANDLE_WINDOW_MS);
  pipeline.expire(candleKey, CANDLE_KEY_TTL_SECONDS);
  pipeline.set(latestKey, newMemberStr, "EX", LATEST_TTL_SECONDS);
  await pipeline.exec();

  currentCandles.set(code, { candle, memberStr: newMemberStr });
  broadcast(code, candle);
}

const SSE_PUSH_INTERVAL_MS = 5_000;

setInterval(() => {
  for (const [code, clients] of sseClients) {
    if (!clients.size) continue;
    const entry = currentCandles.get(code);
    if (!entry) continue;
    broadcast(code, entry.candle);
  }
}, SSE_PUSH_INTERVAL_MS);

// 5계좌 매니저 기동 (모든 종목 항상 구독). 함수 정의가 모두 끝난 뒤 import 하여
// kis/account.ts 와의 순환 의존을 안전하게 해소.
import { startAllAccounts } from "./kis/manager";

const kisHandle =
  process.env.DISABLE_KIS_WS === "true"
    ? { stop: async () => undefined, accounts: [] }
    : startAllAccounts();

export async function stopAllKisAccounts(): Promise<void> {
  await kisHandle.stop();
}
