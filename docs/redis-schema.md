# Redis 데이터 구조

> 이 문서는 노션에 그대로 붙여넣을 수 있도록 작성되었습니다. 전체 선택 → 노션 페이지에 붙여넣으면 헤딩/표/코드블록이 자동 변환됩니다.

## 개요

| 항목 | 값 |
|------|----|
| Redis 클라이언트 | `ioredis` |
| 키 네이밍 규칙 | `<도메인>:<용도>:<식별자>` (콜론 구분) |
| TTL 기준 시각 | KST(UTC+9) 자정, `nextMidnightKstEpoch()` 헬퍼 |
| 도메인 | 주식 실시간(`stock:*`), 뉴스(`news:*`, `stream:news:*`) |

## stock:minute-candles:{code}

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/websocket.ts:149` (`recordToRedis`) |
| 명령어 | `ZREM` + `ZADD` + `ZREMRANGEBYSCORE` + `EXPIRE` (pipeline) |
| 자료구조 | Sorted Set |
| score | `minuteTs` — 해당 분 시작 시각(ms), `floor(now / 60000) * 60000` |
| member | 분봉 JSON 문자열 (아래 필드 표 참고) |
| 슬라이딩 윈도우 | 최근 **40분** (`CANDLE_WINDOW_MS`) |
| 키 TTL | **1시간** (`EXPIRE` 3600초) |

집계 방식

- KIS WebSocket 틱(`H0STCNT0`)을 **1분 OHLCV 분봉**으로 인메모리 집계 후 Redis에 적재
- 동일 분(`minuteTs`) 내에서는 member를 `ZREM` 후 `ZADD`로 교체(OHLC·volume 갱신)
- `volume`은 KIS 누적거래량(`vol`)의 **분 내 델타** (`lastCumVol`로 tick 간 차분)

페이로드 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| code | string | 종목코드 |
| minuteTs | number | 분 시작 ms epoch |
| open | number | 시가(해당 분 첫 체결가) |
| high | number | 고가 |
| low | number | 저가 |
| close | number | 종가(해당 분 최신 체결가) |
| volume | number | 해당 분 체결량(델타 합) |
| change | number | 전일대비 |
| rate | number | 등락률 (%) |
| strength | number | 체결강도(CTTR) |

예시

```json
{
  "code": "005930",
  "minuteTs": 1715511600000,
  "open": 70900,
  "high": 71100,
  "low": 70850,
  "close": 71000,
  "volume": 12500,
  "change": 500,
  "rate": 0.71,
  "strength": 105.3
}
```

## stock:latest:{code}

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/websocket.ts:158` (동일 pipeline) |
| 명령어 | `SET ... EX` |
| 자료구조 | String |
| 값 | 현재 진행 중인 분봉 JSON (`stock:minute-candles:{code}` member와 동일 구조) |
| TTL/보존 | 3일 (`SET ... EX 259200`, 매 틱마다 갱신) |
| 읽기 위치 | `src/app.ts:74` — SSE 연결 직후 초기 스냅샷 1회 |

## news:dedup:{YYYYMMDD}

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:55` |
| 명령어 | `SADD` + `EXPIREAT` |
| 자료구조 | Set |
| 멤버 | 정규화 URL의 SHA1 hex (40자 문자열) |
| URL 정규화 | `protocol://hostname/pathname` (쿼리/프래그먼트 제거) |
| TTL/보존 | 다음 KST 자정 + 1시간 |

## news:seq

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:63` |
| 명령어 | `INCR` |
| 자료구조 | String (Counter) |
| 용도 | 개별 뉴스 ID(`newsId`) 발급 |
| TTL/보존 | 없음 |

## news:item:{newsId}

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:71` |
| 명령어 | `HSET` + `EXPIREAT` |
| 자료구조 | Hash |
| TTL/보존 | 다음 KST 자정 |

필드 (모두 문자열로 저장)

| 필드 | 설명 |
|------|------|
| newsId | 뉴스 ID |
| newUrl | 원본 URL (≤255자) |
| title | 제목 (HTML 제거, ≤50자) |
| content | 본문 (HTML 제거) |
| publishedAt | 발행 시각 (ms epoch) |
| keyword | 검색 키워드 |
| fetchedAt | 수집 시각 (ms epoch) |

## news:today

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:81` |
| 명령어 | `ZADD` + `EXPIREAT` |
| 자료구조 | Sorted Set |
| score | `publishedAt` (ms epoch) |
| member | `newsId` (문자열) |
| TTL/보존 | 다음 KST 자정 |
| 용도 | 당일 뉴스 시간순 인덱스 |

## news:analysis:today

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:122` |
| 명령어 | `HSET` + `EXPIREAT` |
| 자료구조 | Hash |
| TTL/보존 | 다음 KST 자정 |

필드 (모두 문자열로 저장)

| 필드 | 타입(논리) | 설명 |
|------|-----------|------|
| baseTime | ISO 8601 | 분석 기준 시각 |
| analysisResult | string | 종합 평가 |
| summary | string | 핵심 요약 3–5줄 |
| reasoning | string | 분석 논리/근거 |
| keyword | string | 핵심 키워드 (≤50자) |
| newsCount | integer | 분석 뉴스 수 |
| newsIds | JSON array | `[1,2,3,...]` |
| goodSectors | JSON array | `[{sectorName, reason}, ...]` |
| badSectors | JSON array | `[{sectorName, reason}, ...]` |

## stream:news:analysis

| 항목 | 값 |
|------|----|
| 쓰기 위치 | `src/news/redis.ts:140` |
| 명령어 | `XADD stream:news:analysis MAXLEN ~ 1000 * ...` |
| 자료구조 | Stream |
| TTL/보존 | 약 1,000 entries |

필드 (모두 문자열로 저장)

| 필드 | 설명 |
|------|------|
| baseTime | ISO 8601 분석 기준 시각 |
| newsCount | 분석 뉴스 수 |
| keyword | 핵심 키워드 |

## 일일 초기화

| 항목 | 값 |
|------|----|
| 위치 | `src/news/redis.ts:46` (`registerResetJob`) |
| 시각 | 매일 00:00 KST |
| 동작 | `DEL news:today news:analysis:today news:dedup:{어제 YYYYMMDD}` |

## 전체 요약

| 키 | 명령 | 자료구조 | TTL / 한도 | 쓰기 위치 |
|----|------|----------|------------|-----------|
| `stock:minute-candles:{code}` | ZREM+ZADD | Sorted Set | 40분 슬라이딩 / 키 TTL 1h | `src/websocket.ts:149` |
| `stock:latest:{code}` | SET ... EX | String | 3일 (매 틱 갱신) | `src/websocket.ts:158` |
| `news:dedup:{YYYYMMDD}` | SADD | Set | 자정 KST + 1h | `src/news/redis.ts:55` |
| `news:seq` | INCR | String | 없음 | `src/news/redis.ts:63` |
| `news:item:{newsId}` | HSET | Hash | 자정 KST | `src/news/redis.ts:71` |
| `news:today` | ZADD | Sorted Set | 자정 KST | `src/news/redis.ts:81` |
| `news:analysis:today` | HSET | Hash | 자정 KST | `src/news/redis.ts:122` |
| `stream:news:analysis` | XADD | Stream | ~1,000 entries | `src/news/redis.ts:140` |
