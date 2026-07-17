import type { Context } from 'hono';
import type { APIResponse } from '../types/index.js';
import type { AppConfig } from '../config/index.js';

export class HealthController {
  constructor(private readonly config: AppConfig) {}

  status(c: Context) {
    return c.json<APIResponse>({ success: true, status: 'ok', transmissionUrl: this.config.transmissionUrl });
  }
}
