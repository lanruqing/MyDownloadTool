import type { Context } from 'hono';
import type { APIResponse, SessionGetResponse, SessionStatsResponse, FreeSpaceResponse } from '../types/index.js';
import type { TransmissionService } from '../services/transmission.js';

export class SessionController {
  constructor(private readonly service: TransmissionService) {}

  async get(c: Context) {
    try {
      const session = await this.service.getSession();
      const stats = await this.service.getSessionStats();

      let freeSpace = -1;
      if (session['download-dir']) {
        try {
          const freeSpacePayload = await this.service.getFreeSpace(session['download-dir']);
          freeSpace = freeSpacePayload['size-bytes'];
        } catch (error) {
          console.error('Failed to retrieve free space for path:', session['download-dir'], error);
        }
      }

      return c.json<APIResponse>({
        success: true,
        session,
        stats,
        freeSpace,
      });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }

  async update(c: Context) {
    try {
      const body = await c.req.json();
      const downloadDir = body.downloadDir as string | undefined;

      const rpcArgs: Record<string, unknown> = {};
      if (downloadDir !== undefined) {
        rpcArgs['download-dir'] = downloadDir;
      }

      await this.service.setSession(rpcArgs);
      return c.json<APIResponse>({ success: true });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }
}
