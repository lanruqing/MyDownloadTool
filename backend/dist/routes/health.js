export function createHealthRoutes(config) {
    return {
        status(c) {
            return c.json({ success: true, status: 'ok', transmissionUrl: config.transmissionUrl });
        },
    };
}
