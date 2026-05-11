import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NewsItem, NewsAnalysisResult } from "./types";

const SYSTEM_PROMPT = `당신은 한국 주식시장 전문 애널리스트입니다.
입력된 뉴스 목록을 분석하여 한국 증시 섹터에 미칠 영향을 평가하세요.
반드시 아래 JSON 스키마를 따르는 단일 JSON 객체만 출력하세요. 다른 텍스트 금지.

{
  "analysisResult": "전체 시장 영향 종합 평가 (한 단락)",
  "summary": "30개 뉴스의 핵심 요약 (3-5줄)",
  "reasoning": "분석 근거 및 논리 (어떤 뉴스가 어떤 영향)",
  "keyword": "오늘의 핵심 키워드 한 단어 (최대 50자)",
  "goodSectors": [{"sectorName": "반도체", "reason": "..."}],
  "badSectors": [{"sectorName": "건설", "reason": "..."}]
}

sectorName은 한국 KRX 표준 섹터명을 사용하세요 (예: 반도체, 자동차, 2차전지, 바이오, 금융, 건설, 화학, 철강, 에너지, 통신, 유통, IT서비스).`;

export class GeminiClient {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor() {
    const { GEMINI_API_KEY, GEMINI_MODEL } = process.env;
    if (!GEMINI_API_KEY)
      throw new Error("GEMINI_API_KEY 환경변수가 필요합니다.");
    this.client = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.modelName = GEMINI_MODEL ?? "gemini-2.5-pro";
  }

  async analyze(
    items: NewsItem[],
  ): Promise<Omit<NewsAnalysisResult, "baseTime" | "newsCount" | "newsIds">> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    const newsBlock = items
      .map(
        (n, i) =>
          `[${i + 1}] (${new Date(n.publishedAt).toISOString()}) ${n.title}\n${n.content}`,
      )
      .join("\n\n");

    const prompt = `${SYSTEM_PROMPT}\n\n=== 분석 대상 뉴스 (${items.length}개) ===\n${newsBlock}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text) as {
      analysisResult: string;
      summary: string;
      reasoning: string;
      keyword: string;
      goodSectors?: Array<{ sectorName: string; reason?: string }>;
      badSectors?: Array<{ sectorName: string; reason?: string }>;
    };

    return {
      analysisResult: parsed.analysisResult,
      summary: parsed.summary,
      reasoning: parsed.reasoning,
      keyword: (parsed.keyword ?? "").slice(0, 50),
      goodSectors: parsed.goodSectors ?? [],
      badSectors: parsed.badSectors ?? [],
    };
  }
}
