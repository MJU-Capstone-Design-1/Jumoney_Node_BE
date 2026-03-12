| 국내주식 실시간호가 (NXT)         | Unnamed: 1                         | Unnamed: 2      | Unnamed: 3   | Unnamed: 4   | Unnamed: 5   | Unnamed: 6                                                |
|:-------------------------|:-----------------------------------|:----------------|:-------------|:-------------|:-------------|:----------------------------------------------------------|
| API 통신방식                 | WEBSOCKET                          | nan             | nan          | nan          | nan          | nan                                                       |
| 메뉴 위치                    | [국내주식] 실시간시세                       | nan             | nan          | nan          | nan          | nan                                                       |
| API 명                    | 국내주식 실시간호가 (NXT)                   | nan             | nan          | nan          | nan          | nan                                                       |
| API ID                   | 국내주식 실시간호가 (NXT)                   | nan             | nan          | nan          | nan          | nan                                                       |
| 실전 TR_ID                 | H0NXASP0                           | nan             | nan          | nan          | nan          | nan                                                       |
| 모의 TR_ID                 | 모의투자 미지원                           | nan             | nan          | nan          | nan          | nan                                                       |
| 기본정보                     | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| HTTP Method              | POST                               | nan             | nan          | nan          | nan          | nan                                                       |
| 실전 Domain                | ws://ops.koreainvestment.com:21000 | nan             | nan          | nan          | nan          | nan                                                       |
| 모의 Domain                | 모의투자 미지원                           | nan             | nan          | nan          | nan          | nan                                                       |
| URL 명                    | /tryitout/H0NXASP0                 | nan             | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| Layout                   | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| 구분                       | Element                            | 한글명             | Type         | Required     | Length       | Description                                               |
| Request Header           | approval_key                       | 웹소켓 접속키         | string       | N            | 286          | 실시간 (웹소켓) 접속키 발급 API(/oauth2/Approval)를 사용하여 발급받은 웹소켓 접속키 |
| nan                      | custtype                           | 고객타입            | string       | N            | 1            | 'B : 법인_x000D_                                            |
|                          |                                    |                 |              |              |              | P : 개인'                                                   |
| nan                      | tr_type                            | 거래타입            | string       | N            | 1            | '1 : 등록_x000D_                                            |
|                          |                                    |                 |              |              |              | 2 : 해제'                                                   |
| nan                      | content-type                       | 컨텐츠타입           | string       | N            | 1            | '	utf-8'                                                  |
| Request Body             | tr_id                              | 거래ID            | string       | Y            | 2            | H0NXASP0 : 실시간 주식 호가 (NXT)                                |
| nan                      | tr_key                             | 구분값             | string       | Y            | 12           | 종목코드 (ex 005930 삼성전자)                                     |
| Response Header          | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| Response Body            | MKSC_SHRN_ISCD                     | 유가증권 단축 종목코드    | string       | Y            | 9            |                                                           |
| nan                      | BSOP_HOUR                          | 영업 시간           | string       | Y            | 6            |                                                           |
| nan                      | HOUR_CLS_CODE                      | 시간 구분 코드        | string       | Y            | 1            |                                                           |
| nan                      | ASKP1                              | 매도호가1           | string       | Y            | 4            |                                                           |
| nan                      | ASKP2                              | 매도호가2           | string       | Y            | 4            |                                                           |
| nan                      | ASKP3                              | 매도호가3           | string       | Y            | 4            |                                                           |
| nan                      | ASKP4                              | 매도호가4           | string       | Y            | 4            |                                                           |
| nan                      | ASKP5                              | 매도호가5           | string       | Y            | 4            |                                                           |
| nan                      | ASKP6                              | 매도호가6           | string       | Y            | 4            |                                                           |
| nan                      | ASKP7                              | 매도호가7           | string       | Y            | 4            |                                                           |
| nan                      | ASKP8                              | 매도호가8           | string       | Y            | 4            |                                                           |
| nan                      | ASKP9                              | 매도호가9           | string       | Y            | 4            |                                                           |
| nan                      | ASKP10                             | 매도호가10          | string       | Y            | 4            |                                                           |
| nan                      | BIDP1                              | 매수호가1           | string       | Y            | 4            |                                                           |
| nan                      | BIDP2                              | 매수호가2           | string       | Y            | 4            |                                                           |
| nan                      | BIDP3                              | 매수호가3           | string       | Y            | 4            |                                                           |
| nan                      | BIDP4                              | 매수호가4           | string       | Y            | 4            |                                                           |
| nan                      | BIDP5                              | 매수호가5           | string       | Y            | 4            |                                                           |
| nan                      | BIDP6                              | 매수호가6           | string       | Y            | 4            |                                                           |
| nan                      | BIDP7                              | 매수호가7           | string       | Y            | 4            |                                                           |
| nan                      | BIDP8                              | 매수호가8           | string       | Y            | 4            |                                                           |
| nan                      | BIDP9                              | 매수호가9           | string       | Y            | 4            |                                                           |
| nan                      | BIDP10                             | 매수호가10          | string       | Y            | 4            |                                                           |
| nan                      | ASKP_RSQN1                         | 매도호가 잔량1        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN2                         | 매도호가 잔량2        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN3                         | 매도호가 잔량3        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN4                         | 매도호가 잔량4        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN5                         | 매도호가 잔량5        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN6                         | 매도호가 잔량6        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN7                         | 매도호가 잔량7        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN8                         | 매도호가 잔량8        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN9                         | 매도호가 잔량9        | string       | Y            | 8            |                                                           |
| nan                      | ASKP_RSQN10                        | 매도호가 잔량10       | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN1                         | 매수호가 잔량1        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN2                         | 매수호가 잔량2        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN3                         | 매수호가 잔량3        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN4                         | 매수호가 잔량4        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN5                         | 매수호가 잔량5        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN6                         | 매수호가 잔량6        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN7                         | 매수호가 잔량7        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN8                         | 매수호가 잔량8        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN9                         | 매수호가 잔량9        | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN10                        | 매수호가 잔량10       | string       | Y            | 8            |                                                           |
| nan                      | TOTAL_ASKP_RSQN                    | 총 매도호가 잔량       | string       | Y            | 8            |                                                           |
| nan                      | TOTAL_BIDP_RSQN                    | 총 매수호가 잔량       | string       | Y            | 8            |                                                           |
| nan                      | OVTM_TOTAL_ASKP_RSQN               | 시간외 총 매도호가 잔량   | string       | Y            | 8            |                                                           |
| nan                      | OVTM_TOTAL_BIDP_RSQN               | 시간외 총 매수호가 잔량   | string       | Y            | 8            |                                                           |
| nan                      | ANTC_CNPR                          | 예상 체결가          | string       | Y            | 4            |                                                           |
| nan                      | ANTC_CNQN                          | 예상 체결량          | string       | Y            | 8            |                                                           |
| nan                      | ANTC_VOL                           | 예상 거래량          | string       | Y            | 8            |                                                           |
| nan                      | ANTC_CNTG_VRSS                     | 예상 체결 대비        | string       | Y            | 4            |                                                           |
| nan                      | ANTC_CNTG_VRSS_SIGN                | 예상 체결 대비 부호     | string       | Y            | 1            |                                                           |
| nan                      | ANTC_CNTG_PRDY_CTRT                | 예상 체결 전일 대비율    | string       | Y            | 8            |                                                           |
| nan                      | ACML_VOL                           | 누적 거래량          | string       | Y            | 8            |                                                           |
| nan                      | TOTAL_ASKP_RSQN_ICDC               | 총 매도호가 잔량 증감    | string       | Y            | 4            |                                                           |
| nan                      | TOTAL_BIDP_RSQN_ICDC               | 총 매수호가 잔량 증감    | string       | Y            | 4            |                                                           |
| nan                      | OVTM_TOTAL_ASKP_ICDC               | 시간외 총 매도호가 증감   | string       | Y            | 4            |                                                           |
| nan                      | OVTM_TOTAL_BIDP_ICDC               | 시간외 총 매수호가 증감   | string       | Y            | 4            |                                                           |
| nan                      | STCK_DEAL_CLS_CODE                 | 주식 매매 구분 코드     | string       | Y            | 2            |                                                           |
| nan                      | KMID_PRC                           | KRX 중간가         | string       | Y            | 4            |                                                           |
| nan                      | KMID_TOTAL_RSQN                    | KRX 중간가잔량합계수량   | string       | Y            | 8            |                                                           |
| nan                      | KMID_CLS_CODE                      | KRX 중간가 매수매도 구분 | string       | Y            | 1            |                                                           |
| nan                      | NMID_PRC                           | NXT 중간가         | string       | Y            | 4            |                                                           |
| nan                      | NMID_TOTAL_RSQN                    | NXT 중간가잔량합계수량   | string       | Y            | 8            |                                                           |
| nan                      | NMID_CLS_CODE                      | NXT 중간가 매수매도 구분 | string       | Y            | 1            |                                                           |
| Example                  | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| Request Example (Python) | nan                                | nan             | nan          | nan          | nan          | nan                                                       |
| Response Example         | nan                                | nan             | nan          | nan          | nan          | nan                                                       |