import { KisAccount, type KisAccountConfig } from './account';
import { KOSPI_200_CODES, assertKospi200Length } from './symbols';

const MAX_ACCOUNTS = 5;
const ACCOUNT_START_STAGGER_MS = 200;

interface KisCredential {
  index: number;
  appKey: string;
  appSecret: string;
}

/**
 * .env 의 KIS_APP_KEY{1..5} / KIS_APP_SECRET{1..5} 페어를 모두 읽어
 * 채워져 있는 계좌만 반환. 둘 중 하나만 있는 경우는 무시(경고 로그).
 */
export function loadCredentialsFromEnv(): KisCredential[] {
  const creds: KisCredential[] = [];
  for (let i = 1; i <= MAX_ACCOUNTS; i += 1) {
    const appKey = process.env[`KIS_APP_KEY${i}`];
    const appSecret = process.env[`KIS_APP_SECRET${i}`];
    if (!appKey && !appSecret) continue;
    if (!appKey || !appSecret) {
      console.warn(`⚠️ KIS_APP_KEY${i} / KIS_APP_SECRET${i} 중 하나만 설정됨 - 해당 계좌는 무시`);
      continue;
    }
    creds.push({ index: i - 1, appKey, appSecret });
  }
  return creds;
}

/**
 * 종목 리스트를 정렬한 뒤 계좌 수만큼 round-robin 으로 분배.
 *
 * 계좌가 N개라면 codes[i] 는 accounts[i % N] 에 할당된다.
 * → 종목 추가/삭제 시 한 계좌에 변경이 몰리지 않음.
 */
export function shardRoundRobin(codes: readonly string[], n: number): string[][] {
  if (n <= 0) throw new Error('shardRoundRobin: n must be > 0');
  const buckets: string[][] = Array.from({ length: n }, () => []);
  const sorted = [...codes].sort();
  sorted.forEach((code, i) => {
    buckets[i % n].push(code);
  });
  return buckets;
}

/**
 * 모든 계좌를 기동. KIS 측 rate-limit 회피를 위해 200ms 간격으로 stagger.
 * 반환된 핸들의 stop() 으로 graceful shutdown 가능.
 */
export function startAllAccounts(
  symbols: readonly string[] = KOSPI_200_CODES,
): { stop: () => void; accounts: KisAccount[] } {
  assertKospi200Length(symbols);

  const creds = loadCredentialsFromEnv();
  if (creds.length === 0) {
    console.error(
      '❌ KIS_APP_KEY{N}/KIS_APP_SECRET{N} 가 .env 에 하나도 설정되어 있지 않습니다. 웹소켓 기동을 건너뜁니다.',
    );
    return { stop: () => undefined, accounts: [] };
  }

  const buckets = shardRoundRobin(symbols, creds.length);
  console.log(
    `🟢 KIS 계좌 ${creds.length}개로 종목 ${symbols.length}개 분배: ${buckets
      .map((b, i) => `acc#${i + 1}=${b.length}`)
      .join(', ')}`,
  );

  const accounts: KisAccount[] = creds.map((cred, i) => {
    const cfg: KisAccountConfig = {
      index: cred.index,
      appKey: cred.appKey,
      appSecret: cred.appSecret,
      assigned: buckets[i],
    };
    return new KisAccount(cfg);
  });

  accounts.forEach((acc, i) => {
    setTimeout(() => void acc.start(), i * ACCOUNT_START_STAGGER_MS);
  });

  const stop = (): void => {
    for (const acc of accounts) acc.close();
  };

  return { stop, accounts };
}
