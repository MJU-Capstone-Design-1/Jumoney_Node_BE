import dotenv from 'dotenv';

dotenv.config();

import './websocket';
import app, { getAccessToken } from './app';

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  void getAccessToken();
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} 수신, graceful shutdown 시작...`);
  server.close((err) => {
    if (err) {
      console.error('❌ 서버 종료 중 에러:', err);
      process.exit(1);
    }
    console.log('✅ 서버 종료 완료');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('⚠️ 강제 종료 (timeout)');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
