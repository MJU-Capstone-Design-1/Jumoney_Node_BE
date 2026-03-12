| 국내주식 장운영정보 (NXT)         | Unnamed: 1                         | Unnamed: 2     | Unnamed: 3   | Unnamed: 4   | Unnamed: 5   | Unnamed: 6                                                |
|:-------------------------|:-----------------------------------|:---------------|:-------------|:-------------|:-------------|:----------------------------------------------------------|
| API 통신방식                 | REST                               | nan            | nan          | nan          | nan          | nan                                                       |
| 메뉴 위치                    | [국내주식] 실시간시세                       | nan            | nan          | nan          | nan          | nan                                                       |
| API 명                    | 국내주식 장운영정보 (NXT)                   | nan            | nan          | nan          | nan          | nan                                                       |
| API ID                   | 국내주식 장운영정보 (NXT)                   | nan            | nan          | nan          | nan          | nan                                                       |
| 실전 TR_ID                 | H0NXMKO0                           | nan            | nan          | nan          | nan          | nan                                                       |
| 모의 TR_ID                 | 모의투자 미지원                           | nan            | nan          | nan          | nan          | nan                                                       |
| 기본정보                     | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| HTTP Method              | POST                               | nan            | nan          | nan          | nan          | nan                                                       |
| 실전 Domain                | ws://ops.koreainvestment.com:21000 | nan            | nan          | nan          | nan          | nan                                                       |
| 모의 Domain                | 모의투자 미지원                           | nan            | nan          | nan          | nan          | nan                                                       |
| URL 명                    | /tryitout/H0NXMKO0                 | nan            | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| 개요                       | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| Layout                   | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| 구분                       | Element                            | 한글명            | Type         | Required     | Length       | Description                                               |
| Request Header           | approval_key                       | 웹소켓 접속키        | string       | Y            | 286          | 실시간 (웹소켓) 접속키 발급 API(/oauth2/Approval)를 사용하여 발급받은 웹소켓 접속키 |
| nan                      | custtype                           | 고객 타입          | string       | Y            | 1            | B : 법인 _x000D_                                            |
|                          |                                    |                |              |              |              | P : 개인                                                    |
| nan                      | tr_type                            | 거래타입           | string       | Y            | 1            | 1 : 등록_x000D_                                             |
|                          |                                    |                |              |              |              | 2 : 해제                                                    |
| nan                      | content-type                       | 컨텐츠타입          | string       | Y            | 1            | utf-8                                                     |
| Request Body             | tr_id                              | 거래ID           | string       | Y            | 2            | H0NXMKO0 : 국내주식 장운영정보 (NXT)                               |
| nan                      | tr_key                             | 구분값            | string       | Y            | 12           | 종목코드 (ex 005930 삼성전자)                                     |
| Response Header          | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| Response Body            | MKSC_SHRN_ISCD                     | 종목코드           | string       | Y            | 9            |                                                           |
| nan                      | TRHT_YN                            | 거래정지 여부        | string       | Y            | 1            |                                                           |
| nan                      | TR_SUSP_REAS_CNTT                  | 거래 정지 사유 내용    | string       | Y            | 100          |                                                           |
| nan                      | MKOP_CLS_CODE                      | 장운영 구분 코드      | string       | Y            | 3            |                                                           |
| nan                      | ANTC_MKOP_CLS_CODE                 | 예상 장운영 구분 코드   | string       | Y            | 3            |                                                           |
| nan                      | MRKT_TRTM_CLS_CODE                 | 임의연장구분코드       | string       | Y            | 1            |                                                           |
| nan                      | DIVI_APP_CLS_CODE                  | 동시호가배분처리구분코드   | string       | Y            | 2            |                                                           |
| nan                      | ISCD_STAT_CLS_CODE                 | 종목상태구분코드       | string       | Y            | 2            |                                                           |
| nan                      | VI_CLS_CODE                        | VI적용구분코드       | string       | Y            | 1            |                                                           |
| nan                      | OVTM_VI_CLS_CODE                   | 시간외단일가VI적용구분코드 | string       | Y            | 1            |                                                           |
| nan                      | EXCH_CLS_CODE                      | 거래소 구분코드       | string       | Y            | 1            | nan                                                       |
| Example                  | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| Request Example (Python) | nan                                | nan            | nan          | nan          | nan          | nan                                                       |
| Response Example         | nan                                | nan            | nan          | nan          | nan          | nan                                                       |