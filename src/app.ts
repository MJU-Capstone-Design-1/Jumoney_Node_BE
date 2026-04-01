import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// 한국투자증권 응답 타입 정의 (필요한 것 위주로)
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

let accessToken: string = "";

/**
 * 1. 접근 토큰 발급 함수
 */
const getAccessToken = async (): Promise<void> => {
  try {
    const response = await axios.post(`${process.env.KIS_URL}/oauth2/tokenP`, {
      grant_type: "client_credentials",
      appkey: process.env.KIS_APP_KEY,
      appsecret: process.env.KIS_APP_SECRET
    });
    accessToken = response.data.access_token;
    console.log("✅ TS 토큰 발급 성공!");
  } catch (error) {
    console.error("❌ 토큰 발급 실패:", error);
  }
};

/**
 * 2. 현재가 조회 라우트
 */
app.get('/price/:code', async (req: Request, res: Response) => {
  const stockCode = req.params.code;

  if (!accessToken) await getAccessToken();

  try {
    const response = await axios.get<KISPriceResponse>(
      `${process.env.KIS_URL}/uapi/domestic-stock/v1/quotations/inquire-price`,
      {
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${accessToken}`,
          "appkey": process.env.KIS_APP_KEY,
          "appsecret": process.env.KIS_APP_SECRET,
          "tr_id": "FHKST01010100" 
        },
        params: {
          "fid_cond_mrkt_div_code": "J",
          "fid_input_iscd": stockCode
        }
      }
    );

    const { stck_prpr, rprs_mrkt_kor_name, prdy_ctrt } = response.data.output;
    
    res.json({
      name: rprs_mrkt_kor_name,
      price: parseInt(stck_prpr),
      changeRate: parseFloat(prdy_ctrt)
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: "데이터 요청 실패", 
      error: error.response?.data || error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TS Server running at http://localhost:${PORT}`);
  getAccessToken();
});

export default app;