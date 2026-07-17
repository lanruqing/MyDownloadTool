import type { SessionInfo, SessionStats, Torrent } from './types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  torrents?: Torrent[];
  torrent?: unknown;
  isDuplicate?: boolean;
  session?: SessionInfo;
  stats?: SessionStats;
  freeSpace?: number;
  [key: string]: unknown;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as ApiResponse<T>;
  if (!data.success) {
    throw new Error(data.error || 'Unknown API error');
  }

  return data;
}

export async function getTorrents(): Promise<Torrent[]> {
  const response = await fetch('/api/torrents');
  const data = await parseResponse<Torrent[]>(response);
  return data.torrents ?? [];
}

export async function getSessionDetails(): Promise<{ session: SessionInfo; stats: SessionStats; freeSpace: number }> {
  const response = await fetch('/api/session');
  const data = await parseResponse<{ session: SessionInfo; stats: SessionStats; freeSpace: number }>(response);

  return {
    session: data.session ?? { 'download-dir': '', version: '' },
    stats: data.stats ?? { activeTorrentCount: 0, downloadSpeed: 0, uploadSpeed: 0, pausedTorrentCount: 0, torrentCount: 0 },
    freeSpace: data.freeSpace ?? -1,
  };
}

export async function addTorrent(payload: {
  file: File | null;
  url: string;
  downloadDir: string;
  paused: boolean;
}): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('downloadDir', payload.downloadDir);
  formData.append('paused', payload.paused.toString());

  if (payload.file) {
    formData.append('file', payload.file);
  } else {
    formData.append('url', payload.url);
  }

  const response = await fetch('/api/torrents', {
    method: 'POST',
    body: formData,
  });

  return parseResponse(response);
}

export async function updateSessionDirectory(downloadDir: string): Promise<ApiResponse> {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ downloadDir }),
  });
  return parseResponse(response);
}

export async function performTorrentAction(
  id: number,
  action: 'start' | 'stop' | 'delete',
  deleteLocalData = false,
): Promise<ApiResponse> {
  const url = action === 'delete'
    ? `/api/torrents/${id}?deleteData=${deleteLocalData}`
    : `/api/torrents/${id}/${action}`;

  const response = await fetch(url, { method: action === 'delete' ? 'DELETE' : 'POST' });
  return parseResponse(response);
}
