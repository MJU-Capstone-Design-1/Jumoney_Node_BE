import WebSocket from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST ?? '13.209.125.199',
  port: Number(process.env.REDIS_PORT ?? 6379),
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : { password: 'mju_redis' }),
});

/** 모의 31000 / 실전 21000 — 필요 시 env로 덮어쓰기 */
const KIS_WS_URL =
  process.env.KIS_WS_URL ??
  'ws://ops.koreainvestment.com:31000';

const TARGET_STOCKS = ['005930', '000660'];

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
  const dataString = JSON.stringify({ ...parsedData, timestamp });

  const pipeline = redis.multi();
  pipeline.zadd(historyKey, timestamp, dataString);
  pipeline.zremrangebyrank(historyKey, 0, -101);
  pipeline.set(latestKey, dataString);
  await pipeline.exec();
}

function parseKisTick(msg: string): Record<string, unknown> | null {
  if (!msg.startsWith('0') && !msg.startsWith('1')) return null;
  const parts = msg.split('|');
  if (parts.length < 4 || !parts[3]) return null;
  const body = parts[3].split('^');
  if (body.length < 13) return null;

  return {
    code: body[0],
    time: body[1],
    price: parseInt(body[2], 10),
    change: parseInt(body[4], 10),
    rate: parseFloat(body[5]),
    vol: parseInt(body[12], 10),
  };
}

async function startWebSocket() {
  const approvalKey = await getApprovalKey();
  if (!approvalKey) return;

  console.log('✅ 웹소켓 approval_key 발급 성공');

  const ws = new WebSocket(KIS_WS_URL);

  ws.on('open', () => {
    console.log('✅ KIS 웹소켓 접속 성공');

    for (const code of TARGET_STOCKS) {
      ws.send(
        JSON.stringify({
          header: {
            approval_key: approvalKey,
            custtype: 'P',
            tr_type: '1',
            'content-type': 'utf-8',
          },
          body: {
            input: {
              tr_id: 'H0STCNT0',
              tr_key: code,
            },
          },
        }),
      );
    }
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

  ws.on('close', () => console.log('⚠️ 웹소켓 연결 종료'));
  ws.on('error', (err) => console.error('❌ WS 에러:', err));
}

void startWebSocket();
