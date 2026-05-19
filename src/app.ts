import express, { Request, Response } from "express";
import axios from "axios";
import { createHash } from "node:crypto";
import { redis, sseClients } from "./websocket";
import { triggerNewsPipelineOnce } from "./news";
import { getAnalysisNewsItems } from "./news/redis";

interface KISPriceResponse {
  output: {
    stck_prpr: string; // 현재가
    prdy_vrss: string; // 전일 대비 차액
    prdy_ctrt: string; // 전일 대비 등락률
    rprs_mrkt_kor_name: string; // 종목명
  };
  rt_cd: string;
  msg1: string;
}

const app = express();

let accessToken = "";

// 1번 계좌 자격증명을 REST 호출(/price)에도 그대로 사용. 단일 KIS_APP_KEY 가
// 남아있다면 호환을 위해 fallback.
const REST_APP_KEY = process.env.KIS_APP_KEY1 ?? process.env.KIS_APP_KEY;
const REST_APP_SECRET =
  process.env.KIS_APP_SECRET1 ?? process.env.KIS_APP_SECRET;

/**
 * 1. 접근 토큰 발급 함수
 */
export const getAccessToken = async (): Promise<void> => {
  if (!REST_APP_KEY || !REST_APP_SECRET) {
    console.error(
      "❌ KIS_APP_KEY1/SECRET1 (또는 KIS_APP_KEY/SECRET) 가 설정되지 않았습니다.",
    );
    return;
  }
  try {
    const response = await axios.post(`${process.env.KIS_URL}/oauth2/tokenP`, {
      grant_type: "client_credentials",
      appkey: REST_APP_KEY,
      appsecret: REST_APP_SECRET,
    });
    accessToken = response.data.access_token;
    console.log("✅ TS 토큰 발급 성공!");
  } catch (error) {
    console.error("❌ 토큰 발급 실패:", error);
  }
};

/**
 * 헬스체크 (Docker HEALTHCHECK / ALB / 모니터링용)
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/**
 * 실시간 주식 데이터 SSE 스트림
 *
 * NOTE: 5계좌 매니저가 KOSPI 200 전 종목을 항상 구독하고 있으므로
 *       SSE 클라이언트 단위로 lazy subscribe 할 필요가 없다.
 */
app.get("/stream/:code", async (req: Request, res: Response) => {
  const code = req.params.code as string;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 캐시된 최신값 즉시 전송 (장 외 시간 또는 첫 접속 시 초기값 제공)
  const cached = await redis.get(`stock:latest:${code}`);
  if (cached) res.write(`data: ${cached}\n\n`);

  if (!sseClients.has(code)) sseClients.set(code, new Set());
  sseClients.get(code)!.add(res);

  req.on("close", () => {
    sseClients.get(code)?.delete(res);
  });
});

/**
 * 2. 현재가 조회 라우트
 */
app.get("/price/:code", async (req: Request, res: Response) => {
  const stockCode = req.params.code;

  if (!accessToken) await getAccessToken();

  try {
    const response = await axios.get<KISPriceResponse>(
      `${process.env.KIS_URL}/uapi/domestic-stock/v1/quotations/inquire-price`,
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`,
          appkey: REST_APP_KEY,
          appsecret: REST_APP_SECRET,
          tr_id: "FHKST01010100",
        },
        params: {
          fid_cond_mrkt_div_code: "J",
          fid_input_iscd: stockCode,
        },
      },
    );

    const { stck_prpr, rprs_mrkt_kor_name, prdy_ctrt } = response.data.output;

    res.json({
      name: rprs_mrkt_kor_name,
      price: parseInt(stck_prpr),
      changeRate: parseFloat(prdy_ctrt),
    });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    res.status(500).json({
      message: "데이터 요청 실패",
      error: err.response?.data ?? err.message ?? String(error),
    });
  }
});

/**
 * 오늘 분석 1건의 근거가 된 뉴스 30개 목록을 publishedAt 내림차순으로 반환.
 *  - 분석이 아직 없으면 404 (자정 직후/콜드 스타트)
 *  - ETag: baseTime 기반 → 분석이 새로 덮어쓰일 때만 변경
 */
app.get("/news/today", async (req: Request, res: Response) => {
  try {
    const { baseTime, items } = await getAnalysisNewsItems();

    if (!baseTime) {
      return res
        .status(404)
        .json({ message: "no analysis yet", items: [] });
    }

    const etag = `"${createHash("sha1").update(baseTime).digest("hex")}"`;
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }
    res.setHeader("ETag", etag);
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600",
    );
    const publicItems = items.map(({ newUrl, title, content, keyword }) => ({
      newUrl,
      title,
      content,
      keyword,
    }));
    return res.json({
      baseTime,
      count: publicItems.length,
      items: publicItems,
    });

  } catch (e) {
    const err = e as Error;
    return res
      .status(500)
      .json({ message: "failed to load today news", error: err.message });
  }
});

app.post("/admin/news/run", async (req: Request, res: Response) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN
  ) {
    return res.status(403).json({ message: "forbidden" });
  }
  try {
    const force = req.query.force === "1" || req.query.force === "true";
    const result = await triggerNewsPipelineOnce(force);
    return res.json(result);
  } catch (e) {
    const err = e as Error;
    return res
      .status(500)
      .json({ message: "news pipeline failed", error: err.message });
  }
});

export default app;
