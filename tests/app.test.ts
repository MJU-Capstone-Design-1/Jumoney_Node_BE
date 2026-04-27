import request from 'supertest';
import { describe, expect, it,} from 'vitest';

import app from '../src/app';

describe('GET /', () => {
  it('returns the default greeting', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, TypeScript with Express and pnpm!');
  });
});
