import axios from 'axios';
import type { NaverNewsItem } from './types';

const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json';

export class NaverClient {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env;
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new Error('NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수가 필요합니다.');
    }
    this.clientId = NAVER_CLIENT_ID;
    this.clientSecret = NAVER_CLIENT_SECRET;
  }

  async search(keyword: string, display = 10): Promise<NaverNewsItem[]> {
    const { data } = await axios.get<{ items: NaverNewsItem[] }>(NAVER_NEWS_URL, {
      params: { query: keyword, display, sort: 'date' },
      headers: {
        'X-Naver-Client-Id': this.clientId,
        'X-Naver-Client-Secret': this.clientSecret,
      },
      timeout: 10_000,
    });
    return data.items ?? [];
  }
}

export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}

export function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname}`;
  } catch {
    return url.trim().toLowerCase();
  }
}
