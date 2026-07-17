export function createSessionRoutes(service) {
    return {
        async get(c) {
            try {
                const session = await service.getSession();
                const stats = await service.getSessionStats();
                let freeSpace = -1;
                if (session['download-dir']) {
                    try {
                        const freeSpacePayload = await service.getFreeSpace(session['download-dir']);
                        freeSpace = freeSpacePayload['size-bytes'];
                    }
                    catch (error) {
                        console.error('Failed to retrieve free space for path:', session['download-dir'], error);
                    }
                }
                return c.json({
                    success: true,
                    session,
                    stats,
                    freeSpace,
                });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
        async update(c) {
            try {
                const body = await c.req.json();
                const downloadDir = body.downloadDir;
                const rpcArgs = {};
                if (downloadDir !== undefined) {
                    rpcArgs['download-dir'] = downloadDir;
                }
                await service.setSession(rpcArgs);
                return c.json({ success: true });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
    };
}
