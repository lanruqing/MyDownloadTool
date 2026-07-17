import { createTorrentRoutes } from './torrents.js';
import { createSessionRoutes } from './session.js';
import { createHealthRoutes } from './health.js';
export function registerApiRoutes(app, service, config) {
    const torrentRoutes = createTorrentRoutes(service);
    const sessionRoutes = createSessionRoutes(service);
    const healthRoutes = createHealthRoutes(config);
    app.get('/api/torrents', torrentRoutes.list);
    app.post('/api/torrents', torrentRoutes.add);
    app.post('/api/torrents/:id/start', torrentRoutes.start);
    app.post('/api/torrents/:id/stop', torrentRoutes.stop);
    app.delete('/api/torrents/:id', torrentRoutes.remove);
    app.get('/api/session', sessionRoutes.get);
    app.post('/api/session', sessionRoutes.update);
    app.get('/api/health', healthRoutes.status);
}
