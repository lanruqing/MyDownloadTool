import type { Hono } from 'hono';
import type { TorrentController } from '../controllers/torrentController.js';

export function registerTorrentRoutes(app: Hono, controller: TorrentController) {
  app.get('/api/torrents', (c) => controller.list(c));
  app.post('/api/torrents', (c) => controller.add(c));
  app.post('/api/torrents/:id/start', (c) => controller.start(c));
  app.post('/api/torrents/:id/stop', (c) => controller.stop(c));
  app.delete('/api/torrents/:id', (c) => controller.remove(c));
}
