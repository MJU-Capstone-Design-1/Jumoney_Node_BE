import WebSocket from 'ws';
import axios from 'axios';

import { parseKisTick, recordToRedis } from '../websocket';

export interface KisAccountConfig {
  /** 0-based 계좌 인덱스 (.env 의 KIS_APP_KEY{N} 의 N-1) */
  index: number;
  appKey: string;
  appSecret: string;
  /** 이 계좌가 구독해야 할 6자리 종목코드 리스트 */
  assigned: string[];
}

const SUBSCRIBE_INTERVAL_MS = 50;
const APPROVAL_RETRY_MS = 30_000;
const MAX_RECONNECT_MS = 30_000;
const CLOSE_FLUSH_MS = 500;

/**
 * 단일 KIS 계좌(=approval_key 1개) 단위의 WebSocket 라이프사이클.
 *
 * - approval_key 발급
 * - WebSocket 연결 / 자동 재연결(지수 백오프)
 * - 할당 종목 일괄 subscribe (50ms throttle)
 * - 메시지 파싱은 공용 parseKisTick / recordToRedis 사용
 */
export class KisAccount {
  private ws: WebSocket | null = null;
  private approvalKey: string | null = null;
  private reconnectDelay = 1000;
  private closing = false;
  private readonly logTag: string;

  constructor(private readonly config: KisAccountConfig) {
    this.logTag = `[acc#${config.index + 1}]`;
  }

  /** 외부에서 호출하는 진입점. 기동 + 장애 시 자동 재시도. */
  async start(): Promise<void> {
    if (this.closing) return;

    this.approvalKey = await this.fetchApprovalKey();
    if (!this.approvalKey) {
      console.error(
        `${this.logTag} ❌ approval_key 발급 실패, ${APPROVAL_RETRY_MS / 1000}초 후 재시도`,
      );
      setTimeout(() => void this.start(), APPROVAL_RETRY_MS);
      return;
    }

    const preview = this.config.assigned.slice(0, 5).join(',');
    const tail = this.config.assigned.length > 5 ? '...' : '';
    console.log(
      `${this.logTag} ✅ approval_key 발급 성공 (할당 ${this.config.assigned.length}개: ${preview}${tail})`,
    );

    const url = process.env.KIS_WS_URL ?? 'ws://ops.koreainvestment.com:31000';
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.on('open', () => {
      console.log(`${this.logTag} ✅ KIS 웹소켓 접속 성공`);
      this.reconnectDelay = 1000;
      void this.subscribeAll();
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      const msg = typeof raw === 'string' ? raw : raw.toString('utf8');
      void this.handleMessage(msg);
    });

    ws.on('close', () => {
      this.ws = null;
      if (this.closing) return;
      console.log(
        `${this.logTag} ⚠️ 웹소켓 연결 종료, ${this.reconnectDelay / 1000}초 후 재연결`,
      );
      setTimeout(() => void this.start(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_MS);
    });

    ws.on('error', (err) => console.error(`${this.logTag} ❌ WS 에러:`, err));
  }

  /**
   * graceful shutdown.
   * - 보유 종목들을 tr_type:'2' 로 일괄 해지 후 잠깐 대기하여 KIS 서버에 메시지가 flush 되도록 함.
   *   (이렇게 해야 다음 기동 시 잔존 구독으로 인한 MAX SUBSCRIBE OVER 가 발생하지 않음)
   * - 이후 reconnect 하지 않음.
   */
  async close(): Promise<void> {
    this.closing = true;
    const ws = this.ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      let unsubSent = 0;
      for (const code of this.config.assigned) {
        this.sendUnsubscribe(code);
        unsubSent += 1;
      }
      if (unsubSent > 0) {
        console.log(`${this.logTag} 🧹 unsubscribe 전송 완료 (${unsubSent}개) - flush 대기`);
        await new Promise((resolve) => setTimeout(resolve, CLOSE_FLUSH_MS));
      }
    }
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  private async fetchApprovalKey(): Promise<string | null> {
    const base = process.env.KIS_URL;
    if (!base) {
      console.error(`${this.logTag} ❌ KIS_URL 환경변수가 설정되지 않았습니다.`);
      return null;
    }
    try {
      const { data } = await axios.post(`${base}/oauth2/Approval`, {
        grant_type: 'client_credentials',
        appkey: this.config.appKey,
        secretkey: this.config.appSecret,
      });
      const key = data.approval_key as string | undefined;
      return key ?? null;
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown }; message?: string };
      console.error(
        `${this.logTag} ❌ approval_key 발급 실패:`,
        err.response?.data ?? err.message ?? e,
      );
      return null;
    }
  }

  private async subscribeAll(): Promise<void> {
    let sent = 0;
    for (const code of this.config.assigned) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) break;
      this.sendSubscribe(code);
      sent += 1;
      await new Promise((resolve) => setTimeout(resolve, SUBSCRIBE_INTERVAL_MS));
    }
    console.log(`${this.logTag} ✅ subscribe 전송 완료 (${sent}/${this.config.assigned.length})`);
  }

  private sendSubscribe(code: string): void {
    this.sendRegisterFrame(code, '1');
  }

  private sendUnsubscribe(code: string): void {
    this.sendRegisterFrame(code, '2');
  }

  private sendRegisterFrame(code: string, trType: '1' | '2'): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN || !this.approvalKey) return;
    ws.send(
      JSON.stringify({
        header: {
          approval_key: this.approvalKey,
          custtype: 'P',
          tr_type: trType,
          'content-type': 'utf-8',
        },
        body: { input: { tr_id: 'H0STCNT0', tr_key: code } },
      }),
    );
  }

  private async handleMessage(msg: string): Promise<void> {
    const parsed = parseKisTick(msg);
    if (!parsed) {
      if (!msg.startsWith('0') && !msg.startsWith('1')) {
        try {
          const o = JSON.parse(msg) as {
            header?: { tr_id?: string };
            body?: { msg1?: string };
          };
          if (o.header?.tr_id !== 'PINGPONG') {
            console.log(`${this.logTag} ℹ️ 시스템:`, o.body?.msg1 ?? msg);
          }
        } catch {
          /* ignore non-JSON system frames */
        }
      }
      return;
    }

    try {
      await recordToRedis(parsed);
    } catch (e) {
      console.error(`${this.logTag} ❌ Redis 적재 실패:`, e);
    }
  }
}
