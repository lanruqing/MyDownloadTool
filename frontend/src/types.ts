export interface Torrent {
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
}

export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
}

export interface SessionInfo {
  'download-dir': string;
  version: string;
}

export interface StatusDetail {
  label: string;
  color: string;
  bg: string;
}

export const STATUS_MAP: Record<number, StatusDetail> = {
  0: { label: 'Paused', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  1: { label: 'Verifying Wait', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  2: { label: 'Verifying', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
  3: { label: 'Queued', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
  4: { label: 'Downloading', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
  5: { label: 'Seed Queued', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)' },
  6: { label: 'Seeding', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' }
};
