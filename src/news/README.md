# News Pipeline (Node 수집 → Redis → Spring 소비)

## 개요

- 네이버 뉴스 검색 API에서 경제/금융 키워드로 뉴스 수집 (KST 매시 :05, 자정 직전 :23:59 강제 분석)
- URL canonical SHA-1 해시 SET으로 dedup
- 30개 수집 시 또는 23:59에 Gemini로 일일 분석 1건 생성
- Redis 키는 모두 다음 KST 자정에 만료
- Spring은 `stream:news:analysis` 이벤트를 받아 MySQL(News / NewsAnalysis / NewsAnalysisMapping / NewsSectorMapping)에 영속화

## Redis 키 컨트랙트

| Key | Type | 필드 / 의미 |
|---|---|---|
| `news:seq` | STRING (INCR) | 단조 newsId 시퀀스 (영구) |
| `news:item:{newsId}` | HASH | `newsId`, `newUrl`, `title`, `content`, `publishedAt(ms)`, `keyword`, `fetchedAt(ms)` |
| `news:today` | ZSET | member=newsId(str), score=publishedAt(ms) |
| `news:dedup:{YYYYMMDD}` | SET | canonical URL SHA-1 |
| `news:analysis:today` | HASH | `baseTime(ISO)`, `analysisResult`, `summary`, `reasoning`, `keyword`, `newsCount`, `newsIds(JSON)`, `goodSectors(JSON)`, `badSectors(JSON)` |
| `stream:news:analysis` | STREAM (MAXLEN ~1000) | `baseTime`, `newsCount`, `keyword` |

## Spring 소비 절차

```text
1) XREADGROUP GROUP spring-news-consumer <consumer> COUNT 1 STREAMS stream:news:analysis >
2) HGETALL news:analysis:today
   → NewsAnalysis insert (baseTime, analysisResult, summary, reasoning, keyword, newsCount)
3) ZRANGE news:today 0 -1
   for each newsId:
     HGETALL news:item:{newsId} → News insert (newUrl UNIQUE 권장)
     NewsAnalysisMapping insert (newsAnalysisId, newsId)
4) goodSectors/badSectors JSON parse
   for each sector: lookup Sector by sectorName → NewsSectorMapping insert (sectorType=good|bad)
5) XACK stream:news:analysis spring-news-consumer <messageId>
```

## 환경변수

```
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
NEWS_KEYWORDS=경제,금융,주식
NEWS_PER_RUN=30
NEWS_DISPLAY_PER_KEYWORD=10
```

## 수동 트리거 (개발용)

```
POST /admin/news/run            # 30개 수집 후 조건 충족 시 분석
POST /admin/news/run?force=1    # 즉시 분석 강제
```
