import type { Hono } from 'hono';
import type { HealthController } from '../controllers/healthController.js';

export function registerHealthRoutes(app: Hono, controller: HealthController) {
  app.get('/api/health', (c) => controller.status(c));
}
