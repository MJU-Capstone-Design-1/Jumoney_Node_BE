export interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface NewsItem {
  newsId: number;
  newUrl: string;
  title: string;
  content: string;
  publishedAt: number;
  keyword: string;
  fetchedAt: number;
}

export interface SectorImpact {
  sectorName: string;
  reason?: string;
}

export interface NewsAnalysisResult {
  baseTime: string;
  analysisResult: string;
  summary: string;
  reasoning: string;
  keyword: string;
  newsCount: number;
  newsIds: number[];
  goodSectors: SectorImpact[];
  badSectors: SectorImpact[];
}
