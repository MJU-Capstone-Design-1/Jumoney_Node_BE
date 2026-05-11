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

/**
 * 시세 1건을 Redis 에 적재.
 *  - ZSET stock:history:{code} (30분 윈도우)
 *  - STRING stock:latest:{code}
 *  - Stream stream:stock:ticks (MAXLEN ~ 50000)
 *  - 그리고 SSE 구독자에게 broadcast.
 */
export async function recordToRedis(
  parsedData: Record<string, unknown>,
): Promise<void> {
  const code = String(parsedData.code ?? "");
  const historyKey = `stock:history:${code}`;
  const latestKey = `stock:latest:${code}`;

  const timestamp = Date.now();
  const dataWithTs = { ...parsedData, timestamp };
  const dataString = JSON.stringify(dataWithTs);

  const thirtyMinutesAgo = timestamp - 30 * 60 * 1000;

  const pipeline = redis.multi();
  pipeline.zadd(historyKey, timestamp, dataString);
  pipeline.zremrangebyscore(historyKey, 0, thirtyMinutesAgo);
  pipeline.set(latestKey, dataString);
  await pipeline.exec();

  await redis.xadd(
    "stream:stock:ticks",
    "MAXLEN",
    "~",
    "300000",
    "*",
    "code",
    code,
    "price",
    String(parsedData.price),
    "change",
    String(parsedData.change),
    "rate",
    String(parsedData.rate),
    "vol",
    String(parsedData.vol),
    "strength",
    String(parsedData.strength),
    "time",
    String(parsedData.time),
    "timestamp",
    String(timestamp),
  );
  broadcast(code, dataWithTs);
}

// 5계좌 매니저 기동 (모든 종목 항상 구독). 함수 정의가 모두 끝난 뒤 import 하여
// kis/account.ts 와의 순환 의존을 안전하게 해소.
import { startAllAccounts } from "./kis/manager";

const kisHandle = startAllAccounts();

export async function stopAllKisAccounts(): Promise<void> {
  await kisHandle.stop();
}
