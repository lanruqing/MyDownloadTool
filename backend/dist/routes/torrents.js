const torrentFields = [
    'id',
    'name',
    'status',
    'percentDone',
    'rateDownload',
    'rateUpload',
    'totalSize',
    'leftUntilDone',
    'eta',
    'downloadDir',
    'error',
    'errorString',
    'addedDate',
    'doneDate',
    'peersGettingFromUs',
    'peersSendingToUs',
    'isFinished',
    'queuePosition',
    'metadataPercentComplete',
];
export function createTorrentRoutes(service) {
    return {
        async list(c) {
            try {
                const data = await service.getTorrents();
                return c.json({ success: true, torrents: data.torrents });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
        async add(c) {
            try {
                const body = await c.req.parseBody();
                const file = body['file'];
                const url = body['url']?.trim();
                const downloadDir = body['downloadDir']?.trim();
                const paused = body['paused'] === 'true';
                const rpcArgs = { paused };
                if (downloadDir) {
                    rpcArgs['download-dir'] = downloadDir;
                }
                if (file && file instanceof File) {
                    const buffer = await file.arrayBuffer();
                    rpcArgs.metainfo = Buffer.from(buffer).toString('base64');
                }
                else if (url) {
                    rpcArgs.filename = url;
                }
                else {
                    return c.json({
                        success: false,
                        error: 'Please provide either a magnet/torrent URL or upload a .torrent file.',
                    }, 400);
                }
                const data = await service.addTorrent(rpcArgs);
                const addedTorrent = data['torrent-added'] || data['torrent-duplicate'];
                return c.json({
                    success: true,
                    ...data,
                    torrent: addedTorrent,
                    isDuplicate: Boolean(data['torrent-duplicate']),
                });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
        async start(c) {
            try {
                const idParam = c.req.param('id');
                if (!idParam) {
                    return c.json({ success: false, error: 'Torrent id is required' }, 400);
                }
                const id = parseInt(idParam, 10);
                await service.startTorrent(id);
                return c.json({ success: true });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
        async stop(c) {
            try {
                const idParam = c.req.param('id');
                if (!idParam) {
                    return c.json({ success: false, error: 'Torrent id is required' }, 400);
                }
                const id = parseInt(idParam, 10);
                await service.stopTorrent(id);
                return c.json({ success: true });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
        async remove(c) {
            try {
                const idParam = c.req.param('id');
                if (!idParam) {
                    return c.json({ success: false, error: 'Torrent id is required' }, 400);
                }
                const id = parseInt(idParam, 10);
                const deleteData = c.req.query('deleteData') === 'true';
                await service.removeTorrent(id, deleteData);
                return c.json({ success: true });
            }
            catch (error) {
                return c.json({ success: false, error: error.message }, 500);
            }
        },
    };
}
