import { useEffect, useRef, useState } from 'react';
import type { SessionInfo, SessionStats, Torrent } from '../types';
import { addTorrent, getSessionDetails, getTorrents, performTorrentAction, updateSessionDirectory } from '../api';

export function useTransmissionDashboard() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [freeSpace, setFreeSpace] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Torrent>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all'); // 'all', 'series', 'movies', 'others'
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(3000);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [quickPaths, setQuickPaths] = useState<string[]>(() => {
    const saved = localStorage.getItem('transmission_quick_paths');
    return saved
      ? JSON.parse(saved) as string[]
      : ['/downloads/movies', '/downloads/tv', '/downloads/music', '/downloads/games', '/downloads/uncategorized'];
  });

  const autoRefreshRef = useRef(autoRefresh);
  const refreshIntervalRef = useRef(refreshInterval);
  const timerRef = useRef<number>();

  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

  useEffect(() => {
    refreshIntervalRef.current = refreshInterval;
  }, [refreshInterval]);

  const fetchSessionInfo = async () => {
    try {
      const { session, stats, freeSpace } = await getSessionDetails();
      setSession(session);
      setStats(stats);
      setFreeSpace(freeSpace);
      setErrorMsg(null);
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    }
  };

  const fetchTorrentList = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getTorrents();
      setTorrents(data);
      setErrorMsg(null);
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchTorrentList(true), fetchSessionInfo()]);
  };

  useEffect(() => {
    refreshAll();

    const poll = async () => {
      if (!autoRefreshRef.current) {
        return; // 停止轮询
      }
      await Promise.all([fetchTorrentList(), fetchSessionInfo()]);
      timerRef.current = window.setTimeout(poll, refreshIntervalRef.current);
    };

    timerRef.current = window.setTimeout(poll, refreshIntervalRef.current);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSortChange = (field: keyof Torrent) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleTorrentAction = async (id: number, action: 'start' | 'stop' | 'delete', deleteLocalData = false) => {
    try {
      await performTorrentAction(id, action, deleteLocalData);
      setSuccessMsg('Action completed successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
      await Promise.all([fetchTorrentList(), fetchSessionInfo()]);
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    }
  };

  const handleUpdateGlobalDir = async (dir: string) => {
    try {
      await updateSessionDirectory(dir);
      setSuccessMsg('Global download directory updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setShowSettingsModal(false);
      await fetchSessionInfo();
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    }
  };

  const handleAddTorrent = async (payload: { file: File | null; url: string; downloadDir: string; paused: boolean }) => {
    try {
      const response = await addTorrent(payload);
      setSuccessMsg(response.isDuplicate ? 'Torrent already exists in download list!' : 'Torrent added successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowAddModal(false);
      refreshAll();
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    }
  };

  const handleAddQuickPath = (path: string) => {
    if (!quickPaths.includes(path)) {
      const updated = [...quickPaths, path];
      setQuickPaths(updated);
      localStorage.setItem('transmission_quick_paths', JSON.stringify(updated));
    }
  };

  const handleRemoveQuickPath = (path: string) => {
    const updated = quickPaths.filter((p) => p !== path);
    setQuickPaths(updated);
    localStorage.setItem('transmission_quick_paths', JSON.stringify(updated));
  };

  // 根据下载目录判断分类
  const getTorrentCategory = (downloadDir: string): 'series' | 'movies' | 'others' => {
    const lowerDir = downloadDir.toLowerCase();
    if (lowerDir.includes('series') || lowerDir.includes('tv') || lowerDir.includes('season')) {
      return 'series';
    }
    if (lowerDir.includes('movie') || lowerDir.includes('film')) {
      return 'movies';
    }
    return 'others';
  };

  const filteredTorrents = torrents.filter((torrent) => {
    // 按状态过滤
    let statusMatch = true;
    if (filterStatus === 'all') statusMatch = true;
    else if (filterStatus === 'downloading') statusMatch = torrent.status === 3 || torrent.status === 4;
    else if (filterStatus === 'seeding') statusMatch = torrent.status === 5 || torrent.status === 6;
    else if (filterStatus === 'paused') statusMatch = torrent.status === 0;
    else if (filterStatus === 'finished') statusMatch = torrent.isFinished || torrent.percentDone >= 1;

    // 按分类过滤
    let categoryMatch = true;
    if (filterCategory !== 'all') {
      const category = getTorrentCategory(torrent.downloadDir);
      categoryMatch = category === filterCategory;
    }

    return statusMatch && categoryMatch;
  });

  const sortedTorrents = [...filteredTorrents].sort((a, b) => {
    let valA = a[sortField] as string | number;
    let valB = b[sortField] as string | number;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    const numA = typeof valA === 'number' ? valA : 0;
    const numB = typeof valB === 'number' ? valB : 0;
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  });

  const totalDownloadSpeed = torrents.reduce((sum, torrent) => sum + torrent.rateDownload, 0);
  const totalUploadSpeed = torrents.reduce((sum, torrent) => sum + torrent.rateUpload, 0);
  const downloadingCount = torrents.filter((torrent) => torrent.status === 3 || torrent.status === 4).length;
  const seedingCount = torrents.filter((torrent) => torrent.status === 5 || torrent.status === 6).length;
  const pausedCount = torrents.filter((torrent) => torrent.status === 0).length;

  return {
    torrents: sortedTorrents,
    session,
    stats,
    freeSpace,
    loading,
    errorMsg,
    successMsg,
    filterStatus,
    sortField,
    sortOrder,
    autoRefresh,
    refreshInterval,
    showAddModal,
    showSettingsModal,
    quickPaths,
    filterCategory,
    totalDownloadSpeed,
    totalUploadSpeed,
    downloadingCount,
    seedingCount,
    pausedCount,
    setAutoRefresh,
    setRefreshInterval,
    setShowAddModal,
    setShowSettingsModal,
    setFilterStatus,
    setFilterCategory,
    refreshAll,
    handleSortChange,
    handleTorrentAction,
    handleUpdateGlobalDir,
    handleAddTorrent,
    handleAddQuickPath,
    handleRemoveQuickPath,
  };
}
