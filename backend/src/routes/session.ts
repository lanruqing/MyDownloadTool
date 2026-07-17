import type { Hono } from 'hono';
import type { SessionController } from '../controllers/sessionController.js';

export function registerSessionRoutes(app: Hono, controller: SessionController) {
  app.get('/api/session', (c) => controller.get(c));
  app.post('/api/session', (c) => controller.update(c));
}
