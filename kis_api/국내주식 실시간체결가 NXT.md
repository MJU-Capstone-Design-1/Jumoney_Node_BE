| 국내주식 실시간체결가 (NXT)        | Unnamed: 1                         | Unnamed: 2       | Unnamed: 3   | Unnamed: 4   | Unnamed: 5   | Unnamed: 6                                                |
|:-------------------------|:-----------------------------------|:-----------------|:-------------|:-------------|:-------------|:----------------------------------------------------------|
| API 통신방식                 | WEBSOCKET                          | nan              | nan          | nan          | nan          | nan                                                       |
| 메뉴 위치                    | [국내주식] 실시간시세                       | nan              | nan          | nan          | nan          | nan                                                       |
| API 명                    | 국내주식 실시간체결가 (NXT)                  | nan              | nan          | nan          | nan          | nan                                                       |
| API ID                   | 국내주식 실시간체결가 (NXT)                  | nan              | nan          | nan          | nan          | nan                                                       |
| 실전 TR_ID                 | H0NXCNT0                           | nan              | nan          | nan          | nan          | nan                                                       |
| 모의 TR_ID                 | 모의투자 미지원                           | nan              | nan          | nan          | nan          | nan                                                       |
| 기본정보                     | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| HTTP Method              | POST                               | nan              | nan          | nan          | nan          | nan                                                       |
| 실전 Domain                | ws://ops.koreainvestment.com:21000 | nan              | nan          | nan          | nan          | nan                                                       |
| 모의 Domain                | 모의투자 미지원                           | nan              | nan          | nan          | nan          | nan                                                       |
| URL 명                    | /tryitout/H0NXCNT0                 | nan              | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| Layout                   | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| 구분                       | Element                            | 한글명              | Type         | Required     | Length       | Description                                               |
| Request Header           | approval_key                       | 웹소켓 접속키          | string       | N            | 286          | 실시간 (웹소켓) 접속키 발급 API(/oauth2/Approval)를 사용하여 발급받은 웹소켓 접속키 |
| nan                      | custtype                           | 고객타입             | string       | N            | 1            | 'B : 법인_x000D_                                            |
|                          |                                    |                  |              |              |              | P : 개인'                                                   |
| nan                      | tr_type                            | 거래타입             | string       | N            | 1            | '1 : 등록_x000D_                                            |
|                          |                                    |                  |              |              |              | 2 : 해제'                                                   |
| nan                      | content-type                       | 컨텐츠타입            | string       | N            | 1            | '	utf-8'                                                  |
| Request Body             | tr_id                              | 거래ID             | string       | Y            | 2            | H0NXCNT0 : 주식종목체결 (NXT)                                   |
| nan                      | tr_key                             | 구분값              | string       | Y            | 12           | 종목코드 (ex 005930 삼성전자)                                     |
| Response Header          | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| Response Body            | MKSC_SHRN_ISCD                     | 유가증권 단축 종목코드     | string       | Y            | 9            |                                                           |
| nan                      | STCK_CNTG_HOUR                     | 주식 체결 시간         | string       | Y            | 6            |                                                           |
| nan                      | STCK_PRPR                          | 주식 현재가           | string       | Y            | 4            |                                                           |
| nan                      | PRDY_VRSS_SIGN                     | 전일 대비 부호         | string       | Y            | 1            |                                                           |
| nan                      | PRDY_VRSS                          | 전일 대비            | string       | Y            | 4            |                                                           |
| nan                      | PRDY_CTRT                          | 전일 대비율           | string       | Y            | 8            |                                                           |
| nan                      | WGHN_AVRG_STCK_PRC                 | 가중 평균 주식 가격      | string       | Y            | 8            |                                                           |
| nan                      | STCK_OPRC                          | 주식 시가            | string       | Y            | 4            |                                                           |
| nan                      | STCK_HGPR                          | 주식 최고가           | string       | Y            | 4            |                                                           |
| nan                      | STCK_LWPR                          | 주식 최저가           | string       | Y            | 4            |                                                           |
| nan                      | ASKP1                              | 매도호가1            | string       | Y            | 4            |                                                           |
| nan                      | BIDP1                              | 매수호가1            | string       | Y            | 4            |                                                           |
| nan                      | CNTG_VOL                           | 체결 거래량           | string       | Y            | 8            |                                                           |
| nan                      | ACML_VOL                           | 누적 거래량           | string       | Y            | 8            |                                                           |
| nan                      | ACML_TR_PBMN                       | 누적 거래 대금         | string       | Y            | 8            |                                                           |
| nan                      | SELN_CNTG_CSNU                     | 매도 체결 건수         | string       | Y            | 4            |                                                           |
| nan                      | SHNU_CNTG_CSNU                     | 매수 체결 건수         | string       | Y            | 4            |                                                           |
| nan                      | NTBY_CNTG_CSNU                     | 순매수 체결 건수        | string       | Y            | 4            |                                                           |
| nan                      | CTTR                               | 체결강도             | string       | Y            | 8            |                                                           |
| nan                      | SELN_CNTG_SMTN                     | 총 매도 수량          | string       | Y            | 8            |                                                           |
| nan                      | SHNU_CNTG_SMTN                     | 총 매수 수량          | string       | Y            | 8            |                                                           |
| nan                      | CNTG_CLS_CODE                      | 체결구분             | string       | Y            | 1            |                                                           |
| nan                      | SHNU_RATE                          | 매수비율             | string       | Y            | 8            |                                                           |
| nan                      | PRDY_VOL_VRSS_ACML_VOL_RATE        | 전일 거래량 대비 등락율    | string       | Y            | 8            |                                                           |
| nan                      | OPRC_HOUR                          | 시가 시간            | string       | Y            | 6            |                                                           |
| nan                      | OPRC_VRSS_PRPR_SIGN                | 시가대비구분           | string       | Y            | 1            |                                                           |
| nan                      | OPRC_VRSS_PRPR                     | 시가대비             | string       | Y            | 4            |                                                           |
| nan                      | HGPR_HOUR                          | 최고가 시간           | string       | Y            | 6            |                                                           |
| nan                      | HGPR_VRSS_PRPR_SIGN                | 고가대비구분           | string       | Y            | 1            |                                                           |
| nan                      | HGPR_VRSS_PRPR                     | 고가대비             | string       | Y            | 4            |                                                           |
| nan                      | LWPR_HOUR                          | 최저가 시간           | string       | Y            | 6            |                                                           |
| nan                      | LWPR_VRSS_PRPR_SIGN                | 저가대비구분           | string       | Y            | 1            |                                                           |
| nan                      | LWPR_VRSS_PRPR                     | 저가대비             | string       | Y            | 4            |                                                           |
| nan                      | BSOP_DATE                          | 영업 일자            | string       | Y            | 8            |                                                           |
| nan                      | NEW_MKOP_CLS_CODE                  | 신 장운영 구분 코드      | string       | Y            | 2            |                                                           |
| nan                      | TRHT_YN                            | 거래정지 여부          | string       | Y            | 1            |                                                           |
| nan                      | ASKP_RSQN1                         | 매도호가 잔량1         | string       | Y            | 8            |                                                           |
| nan                      | BIDP_RSQN1                         | 매수호가 잔량1         | string       | Y            | 8            |                                                           |
| nan                      | TOTAL_ASKP_RSQN                    | 총 매도호가 잔량        | string       | Y            | 8            |                                                           |
| nan                      | TOTAL_BIDP_RSQN                    | 총 매수호가 잔량        | string       | Y            | 8            |                                                           |
| nan                      | VOL_TNRT                           | 거래량 회전율          | string       | Y            | 8            |                                                           |
| nan                      | PRDY_SMNS_HOUR_ACML_VOL            | 전일 동시간 누적 거래량    | string       | Y            | 8            |                                                           |
| nan                      | PRDY_SMNS_HOUR_ACML_VOL_RATE       | 전일 동시간 누적 거래량 비율 | string       | Y            | 8            |                                                           |
| nan                      | HOUR_CLS_CODE                      | 시간 구분 코드         | string       | Y            | 1            |                                                           |
| nan                      | MRKT_TRTM_CLS_CODE                 | 임의종료구분코드         | string       | Y            | 1            |                                                           |
| nan                      | VI_STND_PRC                        | 정적VI발동기준가        | string       | Y            | 4            |                                                           |
| Example                  | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| Request Example (Python) | nan                                | nan              | nan          | nan          | nan          | nan                                                       |
| Response Example         | nan                                | nan              | nan          | nan          | nan          | nan                                                       |