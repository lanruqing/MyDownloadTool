/** Transmission RPC 相关类型定义 */

export interface TransmissionRPCRequest {
  method: string;
  arguments: Record<string, unknown>;
}

export interface TransmissionRPCResponse<T = unknown> {
  result: string;
  arguments: T;
}

export interface TorrentFields {
  id: number;
  name: string;
  status: number;
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  totalSize: number;
  leftUntilDone: number;
  eta: number;
  downloadDir: string;
  error: number;
  errorString: string;
  addedDate: number;
  doneDate: number;
  peersGettingFromUs: number;
  peersSendingToUs: number;
  isFinished: boolean;
  queuePosition: number;
  metadataPercentComplete: number;
}

export interface TorrentGetResponse {
  torrents: TorrentFields[];
}

export interface TorrentAddArgs {
  paused?: boolean;
  'download-dir'?: string;
  metainfo?: string;
  filename?: string;
}

export interface TorrentAddResponse {
  'torrent-added'?: { id: number; name: string; hashString: string };
  'torrent-duplicate'?: { id: number; name: string; hashString: string };
}

export interface SessionGetResponse {
  'download-dir': string;
  version: string;
  [key: string]: unknown;
}

export interface SessionStatsResponse {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  [key: string]: unknown;
}

export interface FreeSpaceResponse {
  'size-bytes': number;
  path: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}