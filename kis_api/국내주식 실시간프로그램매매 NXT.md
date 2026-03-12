| 국내주식 실시간프로그램매매 (NXT)     | Unnamed: 1                         | Unnamed: 2   | Unnamed: 3   | Unnamed: 4   | Unnamed: 5   | Unnamed: 6                                                |
|:-------------------------|:-----------------------------------|:-------------|:-------------|:-------------|:-------------|:----------------------------------------------------------|
| API 통신방식                 | WEBSOCKET                          | nan          | nan          | nan          | nan          | nan                                                       |
| 메뉴 위치                    | [국내주식] 실시간시세                       | nan          | nan          | nan          | nan          | nan                                                       |
| API 명                    | 국내주식 실시간프로그램매매 (NXT)               | nan          | nan          | nan          | nan          | nan                                                       |
| API ID                   | 국내주식 실시간프로그램매매 (NXT)               | nan          | nan          | nan          | nan          | nan                                                       |
| 실전 TR_ID                 | H0NXPGM0                           | nan          | nan          | nan          | nan          | nan                                                       |
| 모의 TR_ID                 | 모의투자 미지원                           | nan          | nan          | nan          | nan          | nan                                                       |
| 기본정보                     | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| HTTP Method              | POST                               | nan          | nan          | nan          | nan          | nan                                                       |
| 실전 Domain                | ws://ops.koreainvestment.com:21000 | nan          | nan          | nan          | nan          | nan                                                       |
| 모의 Domain                | 모의투자 미지원                           | nan          | nan          | nan          | nan          | nan                                                       |
| URL 명                    | /tryitout/H0NXPGM0                 | nan          | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| Layout                   | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| 구분                       | Element                            | 한글명          | Type         | Required     | Length       | Description                                               |
| Request Header           | approval_key                       | 웹소켓 접속키      | string       | N            | 286          | 실시간 (웹소켓) 접속키 발급 API(/oauth2/Approval)를 사용하여 발급받은 웹소켓 접속키 |
| nan                      | custtype                           | 고객타입         | string       | N            | 1            | 'B : 법인_x000D_                                            |
|                          |                                    |              |              |              |              | P : 개인'                                                   |
| nan                      | tr_type                            | 거래타입         | string       | N            | 1            | '1 : 등록_x000D_                                            |
|                          |                                    |              |              |              |              | 2 : 해제'                                                   |
| nan                      | content-type                       | 컨텐츠타입        | string       | N            | 1            | '	utf-8'                                                  |
| Request Body             | tr_id                              | 거래ID         | string       | Y            | 2            | H0NXPGM0 : 실시간 주식프로그램매매 (NXT)                             |
| nan                      | tr_key                             | 구분값          | string       | Y            | 12           | 종목코드 (ex 005930 삼성전자)                                     |
| Response Header          | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| Response Body            | MKSC_SHRN_ISCD                     | 유가증권 단축 종목코드 | string       | Y            | 9            |                                                           |
| nan                      | STCK_CNTG_HOUR                     | 주식 체결 시간     | string       | Y            | 6            |                                                           |
| nan                      | SELN_CNQN                          | 매도 체결량       | string       | Y            | 8            |                                                           |
| nan                      | SELN_TR_PBMN                       | 매도 거래 대금     | string       | Y            | 8            |                                                           |
| nan                      | SHNU_CNQN                          | 매수2 체결량      | string       | Y            | 8            |                                                           |
| nan                      | SHNU_TR_PBMN                       | 매수2 거래 대금    | string       | Y            | 8            |                                                           |
| nan                      | NTBY_CNQN                          | 순매수 체결량      | string       | Y            | 8            |                                                           |
| nan                      | NTBY_TR_PBMN                       | 순매수 거래 대금    | string       | Y            | 8            |                                                           |
| nan                      | SELN_RSQN                          | 매도호가잔량       | string       | Y            | 8            |                                                           |
| nan                      | SHNU_RSQN                          | 매수호가잔량       | string       | Y            | 8            |                                                           |
| nan                      | WHOL_NTBY_QTY                      | 전체순매수호가잔량    | string       | Y            | 8            |                                                           |
| Example                  | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| Request Example (Python) | nan                                | nan          | nan          | nan          | nan          | nan                                                       |
| Response Example         | nan                                | nan          | nan          | nan          | nan          | nan                                                       |