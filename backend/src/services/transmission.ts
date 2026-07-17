/** Transmission RPC 服务 - 封装与 Transmission 守护进程的通信 */

import type {
  TorrentGetResponse,
  TorrentAddArgs,
  TorrentAddResponse,
  SessionGetResponse,
  SessionStatsResponse,
  FreeSpaceResponse,
} from '../types/index.js';
import type { TransmissionRepository } from '../repositories/transmissionRepository.js';

export class TransmissionService {
  constructor(private readonly repository: TransmissionRepository) {}

  /** 获取种子列表 */
  async getTorrents(): Promise<TorrentGetResponse> {
    const fields = [
      'id', 'name', 'status', 'percentDone', 'rateDownload', 'rateUpload',
      'totalSize', 'leftUntilDone', 'eta', 'downloadDir', 'error', 'errorString',
      'addedDate', 'doneDate', 'peersGettingFromUs', 'peersSendingToUs',
      'isFinished', 'queuePosition', 'metadataPercentComplete',
    ];
    return this.repository.callRPC<TorrentGetResponse>('torrent-get', { fields });
  }

  /** 添加种子 */
  async addTorrent(args: TorrentAddArgs): Promise<TorrentAddResponse> {
    return this.repository.callRPC<TorrentAddResponse>('torrent-add', args as Record<string, unknown>);
  }

  /** 启动种子 */
  async startTorrent(id: number): Promise<void> {
    await this.repository.callRPC('torrent-start', { ids: [id] });
  }

  /** 停止种子 */
  async stopTorrent(id: number): Promise<void> {
    await this.repository.callRPC('torrent-stop', { ids: [id] });
  }

  /** 删除种子 */
  async removeTorrent(id: number, deleteLocalData: boolean): Promise<void> {
    await this.repository.callRPC('torrent-remove', {
      ids: [id],
      'delete-local-data': deleteLocalData,
    });
  }

  /** 获取会话设置 */
  async getSession(): Promise<SessionGetResponse> {
    return this.repository.callRPC<SessionGetResponse>('session-get');
  }

  /** 获取会话统计 */
  async getSessionStats(): Promise<SessionStatsResponse> {
    return this.repository.callRPC<SessionStatsResponse>('session-stats');
  }

  /** 获取空闲空间 */
  async getFreeSpace(path: string): Promise<FreeSpaceResponse> {
    return this.repository.callRPC<FreeSpaceResponse>('free-space', { path });
  }

  /** 更新会话设置 */
  async setSession(args: Record<string, unknown>): Promise<void> {
    await this.repository.callRPC('session-set', args);
  }
}