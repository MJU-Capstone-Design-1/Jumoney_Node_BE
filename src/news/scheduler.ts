import cron, { type ScheduledTask } from 'node-cron';

const TZ = 'Asia/Seoul';
const tasks: ScheduledTask[] = [];

export function registerHourlyJob(handler: () => Promise<void>): void {
  tasks.push(
    cron.schedule('5 * * * *', () => void runSafe('hourly', handler), { timezone: TZ }),
  );
}

export function registerFinalJob(handler: () => Promise<void>): void {
  tasks.push(
    cron.schedule('59 23 * * *', () => void runSafe('final-23:59', handler), { timezone: TZ }),
  );
}

export function registerResetJob(handler: () => Promise<void>): void {
  tasks.push(
    cron.schedule('0 0 * * *', () => void runSafe('reset-00:00', handler), { timezone: TZ }),
  );
}

export function stopAll(): void {
  for (const t of tasks) t.stop();
  tasks.length = 0;
}

async function runSafe(label: string, handler: () => Promise<void>): Promise<void> {
  try {
    console.log(`[news:${label}] start`);
    await handler();
    console.log(`[news:${label}] done`);
  } catch (e) {
    console.error(`[news:${label}] error`, e);
  }
}
