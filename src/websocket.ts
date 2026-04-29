import WebSocket from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import dotenv from 'dotenv';
import type { Response } from 'express';

dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
  throw new Error(
    'REDIS_HOST, REDIS_PORT, REDIS_PASSWORD 환경변수가 모두 필요합니다. .env 파일을 확인하세요.',
  );
}

export const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
});

redis.on('error', (err) => console.error('❌ Redis 연결 에러:', err));

/** 모의 31000 / 실전 21000 — 필요 시 env로 덮어쓰기 */
const KIS_WS_URL = process.env.KIS_WS_URL ?? 'ws://ops.koreainvestment.com:31000';

// 종목코드 → 연결된 SSE 클라이언트
export const sseClients = new Map<string, Set<Response>>();

export function broadcast(code: string, data: unknown) {
  const clients = sseClients.get(code);
  if (!clients?.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

let ws: WebSocket | null = null;
let approvalKey: string | null = null;
let reconnectDelay = 1000;

// SSE 클라이언트 기준으로 구독해야 할 종목 목록
const subscribedStocks = new Set<string>();

function sendSubscribe(code: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      header: {
        approval_key: approvalKey,
        custtype: 'P',
        tr_type: '1',
        'content-type': 'utf-8',
      },
      body: { input: { tr_id: 'H0STCNT0', tr_key: code } },
    }),
  );
}

function sendUnsubscribe(code: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      header: {
        approval_key: approvalKey,
        custtype: 'P',
        tr_type: '2',
        'content-type': 'utf-8',
      },
      body: { input: { tr_id: 'H0STCNT0', tr_key: code } },
    }),
  );
}

export function onClientConnect(code: string) {
  if (!subscribedStocks.has(code)) {
    subscribedStocks.add(code);
    sendSubscribe(code);
  }
}

export function onClientDisconnect(code: string) {
  const clients = sseClients.get(code);
  if (!clients?.size) {
    subscribedStocks.delete(code);
    sendUnsubscribe(code);
  }
}

async function getApprovalKey(): Promise<string | null> {
  const base = process.env.KIS_URL;
  if (!base || !process.env.KIS_APP_KEY || !process.env.KIS_APP_SECRET) {
    console.error('❌ KIS_URL, KIS_APP_KEY, KIS_APP_SECRET을 .env에 설정하세요.');
    return null;
  }
  try {
    const { data } = await axios.post(`${base}/oauth2/Approval`, {
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APP_KEY,
      secretkey: process.env.KIS_APP_SECRET,
    });
    const key = data.approval_key as string | undefined;
    return key ?? null;
  } catch (e: unknown) {
    const err = e as { response?: { data?: unknown }; message?: string };
    console.error('❌ 웹소켓 approval_key 발급 실패:', err.response?.data ?? err.message ?? e);
    return null;
  }
}

async function recordToRedis(parsedData: Record<string, unknown>) {
  const code = String(parsedData.code ?? '');
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

  await redis.publish(`stock:tick:${code}`, dataString);
  broadcast(code, dataWithTs);
}

function parseKisTick(msg: string): Record<string, unknown> | null {
  if (!msg.startsWith('0') && !msg.startsWith('1')) return null;
  const parts = msg.split('|');
  if (parts.length < 4 || !parts[3]) return null;
  const body = parts[3].split('^');
  if (body.length < 13) return null;

  const price = parseInt(body[2], 10);
  const change = parseInt(body[4], 10);
  const rate = parseFloat(body[5]);
  const vol = parseInt(body[12], 10);

  if (isNaN(price) || isNaN(change) || isNaN(rate) || isNaN(vol)) return null;

  return {
    code: body[0],
    time: body[1],
    price,
    change,
    rate,
    vol,
  };
}

async function startWebSocket() {
  approvalKey = await getApprovalKey();
  if (!approvalKey) {
    console.error('❌ approval_key 발급 실패, 30초 후 재시도');
    setTimeout(() => void startWebSocket(), 30_000);
    return;
  }

  console.log('✅ 웹소켓 approval_key 발급 성공');
  ws = new WebSocket(KIS_WS_URL);

  ws.on('open', () => {
    console.log('✅ KIS 웹소켓 접속 성공');
    reconnectDelay = 1000;
    for (const code of subscribedStocks) sendSubscribe(code);
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    const msg = typeof raw === 'string' ? raw : raw.toString('utf8');

    void (async () => {
      const parsed = parseKisTick(msg);
      if (!parsed) {
        if (!msg.startsWith('0') && !msg.startsWith('1')) {
          try {
            const o = JSON.parse(msg) as { header?: { tr_id?: string }; body?: { msg1?: string } };
            if (o.header?.tr_id !== 'PINGPONG') console.log('ℹ️ 시스템:', o.body?.msg1 ?? msg);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      try {
        await recordToRedis(parsed);
        console.log(`📈 [${parsed.code}] Redis 적재: ${parsed.price}원`);
      } catch (e) {
        console.error('❌ Redis 적재 실패:', e);
      }
    })();
  });

  ws.on('close', () => {
    ws = null;
    console.log(`⚠️ 웹소켓 연결 종료, ${reconnectDelay / 1000}초 후 재연결`);
    setTimeout(() => void startWebSocket(), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
  });

  ws.on('error', (err) => console.error('❌ WS 에러:', err));
}

void startWebSocket();
