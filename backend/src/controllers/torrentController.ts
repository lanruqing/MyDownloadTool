import type { Context } from 'hono';
import type { TorrentAddArgs, TorrentAddResponse, TorrentGetResponse, APIResponse } from '../types/index.js';
import type { TransmissionService } from '../services/transmission.js';

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

export class TorrentController {
  constructor(private readonly service: TransmissionService) {}

  async list(c: Context) {
    try {
      const data = await this.service.getTorrents();
      return c.json<APIResponse<TorrentGetResponse>>({ success: true, torrents: data.torrents });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }

  async add(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body['file'];
      const url = (body['url'] as string | undefined)?.trim();
      const downloadDir = (body['downloadDir'] as string | undefined)?.trim();
      const paused = body['paused'] === 'true';

      const rpcArgs: TorrentAddArgs = { paused };

      if (downloadDir) {
        rpcArgs['download-dir'] = downloadDir;
      }

      if (file && file instanceof File) {
        const buffer = await file.arrayBuffer();
        rpcArgs.metainfo = Buffer.from(buffer).toString('base64');
      } else if (url) {
        rpcArgs.filename = url;
      } else {
        return c.json<APIResponse>({
          success: false,
          error: 'Please provide either a magnet/torrent URL or upload a .torrent file.',
        }, 400);
      }

      const data = await this.service.addTorrent(rpcArgs);
      const addedTorrent = data['torrent-added'] || data['torrent-duplicate'];

      return c.json<APIResponse<TorrentAddResponse>>({
        success: true,
        ...data,
        torrent: addedTorrent,
        isDuplicate: Boolean(data['torrent-duplicate']),
      });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }

  async start(c: Context) {
    try {
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json<APIResponse>({ success: false, error: 'Torrent id is required' }, 400);
      }
      const id = parseInt(idParam, 10);
      await this.service.startTorrent(id);
      return c.json<APIResponse>({ success: true });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }

  async stop(c: Context) {
    try {
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json<APIResponse>({ success: false, error: 'Torrent id is required' }, 400);
      }
      const id = parseInt(idParam, 10);
      await this.service.stopTorrent(id);
      return c.json<APIResponse>({ success: true });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }

  async remove(c: Context) {
    try {
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json<APIResponse>({ success: false, error: 'Torrent id is required' }, 400);
      }
      const id = parseInt(idParam, 10);
      const deleteData = c.req.query('deleteData') === 'true';
      await this.service.removeTorrent(id, deleteData);
      return c.json<APIResponse>({ success: true });
    } catch (error: unknown) {
      return c.json<APIResponse>({ success: false, error: (error as Error).message }, 500);
    }
  }
}
