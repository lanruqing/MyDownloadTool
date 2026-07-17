import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import * as dotenv from 'dotenv';
import { loadConfig } from './config/index.js';
import { TransmissionRepositoryImpl } from './repositories/transmissionRepository.js';
import { TransmissionService } from './services/transmission.js';
import { registerApiRoutes } from './routes/index.js';

dotenv.config();

const config = loadConfig();
const app = new Hono();
const transmissionRepository = new TransmissionRepositoryImpl(config);
const transmissionService = new TransmissionService(transmissionRepository);

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

registerApiRoutes(app, transmissionService, config);

console.log(`Hono backend starting on port ${config.port}`);
serve({
  fetch: app.fetch,
  port: config.port,
});
