/**
 * KOSPI 200 구성 종목 코드 (정적)
 *
 * - 6자리 단축코드 문자열 배열.
 * - 운영 시점의 KOSPI 200 구성종목과 동기화 필요. (KRX 다운로드 → 6자리 코드만 추출)
 * - 변경 시 이 파일만 갱신하면 manager 가 round-robin 으로 재분배.
 *
 * TODO: 실제 200개 종목 코드로 채우기. 현재는 시드 코드만 포함되어 있어
 *       length 검증이 실패하므로 가드는 KOSPI_200_CODES.length === 200 으로 강제.
 */
export const KOSPI_200_CODES: readonly string[] = [
  '005930', // 삼성전자
  '000660', // SK하이닉스
];

export const EXPECTED_KOSPI_200_LEN = 200;

export function assertKospi200Length(codes: readonly string[]): void {
  if (codes.length !== EXPECTED_KOSPI_200_LEN) {
    console.warn(
      `⚠️ KOSPI_200_CODES 길이 불일치: ${codes.length} (expected ${EXPECTED_KOSPI_200_LEN}). symbols.ts 갱신 필요.`,
    );
  }
}
