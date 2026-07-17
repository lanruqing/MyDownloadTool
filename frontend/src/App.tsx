import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { TorrentList } from './components/TorrentList';
import { AddTorrentModal } from './components/AddTorrentModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsFooter } from './components/StatsFooter';
import { useTransmissionDashboard } from './hooks/useTransmissionDashboard';

export default function App() {
  const {
    torrents,
    session,
    stats,
    freeSpace,
    loading,
    errorMsg,
    successMsg,
    filterStatus,
    filterCategory,
    sortField,
    sortOrder,
    autoRefresh,
    refreshInterval,
    showAddModal,
    showSettingsModal,
    quickPaths,
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
  } = useTransmissionDashboard();

  return (
    <div className="dashboard-container">
      <Header
        version={session?.version}
        downloadSpeed={totalDownloadSpeed}
        uploadSpeed={totalUploadSpeed}
        freeSpace={freeSpace}
      />

      {errorMsg && (
        <wired-card className="glow-error animate-draw" style={{ backgroundColor: 'rgba(248, 113, 113, 0.05)', borderColor: 'var(--error-color)', padding: '0.8rem 1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error-color)' }}>
            <AlertTriangle size={18} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem' }}>{errorMsg}</span>
          </div>
        </wired-card>
      )}

      {successMsg && (
        <wired-card className="glow-success animate-draw" style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)', borderColor: 'var(--success-color)', padding: '0.8rem 1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem' }}>{successMsg}</span>
          </div>
        </wired-card>
      )}

      <ControlBar
        onAddClick={() => setShowAddModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        onForceRefresh={refreshAll}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        refreshInterval={refreshInterval}
        onIntervalChange={setRefreshInterval}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
      />

      <TorrentList
        torrents={torrents}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onAction={handleTorrentAction}
      />

      <StatsFooter
        downloadSpeed={stats?.downloadSpeed || 0}
        uploadSpeed={stats?.uploadSpeed || 0}
        downloadingCount={downloadingCount}
        seedingCount={seedingCount}
        pausedCount={pausedCount}
        totalCount={torrents.length}
      />

      <AddTorrentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTorrent}
        defaultDir={session?.['download-dir'] || ''}
        quickPaths={quickPaths}
      />

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultDir={session?.['download-dir'] || ''}
        onUpdateDefaultDir={handleUpdateGlobalDir}
        quickPaths={quickPaths}
        onAddQuickPath={handleAddQuickPath}
        onRemoveQuickPath={handleRemoveQuickPath}
      />
    </div>
  );
}
