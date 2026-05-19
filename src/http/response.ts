/**
 * Spring MSA 공통 응답 포맷.
 *  - 성공: { success: true, code, message, data? }   (data 가 undefined 면 필드 자체 생략)
 *  - 실패: { success: false, code, message }         (에러 시 data 필드는 항상 제외)
 */
export type ApiSuccess<T> =
  | { success: true; code: string; message: string }
  | { success: true; code: string; message: string; data: T };

export type ApiError = {
  success: false;
  code: string;
  message: string;
};

export function ok<T>(code: string, message: string, data?: T): ApiSuccess<T> {
  return data === undefined
    ? { success: true, code, message }
    : { success: true, code, message, data };
}

export function fail(code: string, message: string): ApiError {
  return { success: false, code, message };
}

// 도메인 prefix + HTTP 상태 + suffix.  오타 방지/검색 용이.
export const CODE = {
  NEWS: {
    OK: "NEWS200_OK",
    NO_ANALYSIS: "NEWS404_NO_ANALYSIS",
    LOAD_FAILED: "NEWS500_LOAD_FAILED",
  },
  STOCK: {
    OK: "STOCK200_OK",
    KIS_FAILED: "STOCK500_KIS_FAILED",
  },
  COMMON: {
    INTERNAL: "COMMON500",
  },
} as const;
