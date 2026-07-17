import type { Hono } from 'hono';
import type { TransmissionService } from '../services/transmission.js';
import type { AppConfig } from '../config/index.js';
import { TorrentController } from '../controllers/torrentController.js';
import { SessionController } from '../controllers/sessionController.js';
import { HealthController } from '../controllers/healthController.js';
import { registerTorrentRoutes } from './torrents.js';
import { registerSessionRoutes } from './session.js';
import { registerHealthRoutes } from './health.js';

export function registerApiRoutes(app: Hono, service: TransmissionService, config: AppConfig) {
  const torrentController = new TorrentController(service);
  const sessionController = new SessionController(service);
  const healthController = new HealthController(config);

  registerTorrentRoutes(app, torrentController);
  registerSessionRoutes(app, sessionController);
  registerHealthRoutes(app, healthController);
}
