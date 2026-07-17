import React from 'react';
import { Play, Pause, Trash2, Folder, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import { STATUS_MAP } from '../types';
import type { Torrent } from '../types';
import { formatBytes, formatSpeed, formatETA } from '../utils/formatters';

interface TorrentRowProps {
  torrent: Torrent;
  onAction: (id: number, action: 'start' | 'stop' | 'delete', deleteLocalData?: boolean) => void;
}

export const TorrentRow: React.FC<TorrentRowProps> = ({ torrent, onAction }) => {
  const statusDetails = STATUS_MAP[torrent.status] || { label: 'Unknown', color: '#fff', bg: 'rgba(255,255,255,0.1)' };
  const pct = Math.round(torrent.percentDone * 1000) / 10;

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '0.9rem'
      }}
    >
      {/* Column 1: Name, Save Path & Errors */}
      <div style={{ paddingRight: '1rem' }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: '0.2rem' }}>
          {torrent.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          <Folder size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ wordBreak: 'break-all' }}>{torrent.downloadDir}</span>
        </div>
        {torrent.errorString && (
          <div style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
            <AlertTriangle size={12} />
            <span>{torrent.errorString}</span>
          </div>
        )}
      </div>

      {/* Column 2: Size */}
      <div>
        <div>{formatBytes(torrent.totalSize)}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          left: {formatBytes(torrent.leftUntilDone)}
        </div>
      </div>

      {/* Column 3: Progress & ETA */}
      <div style={{ paddingRight: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
          <span style={{ 
            color: statusDetails.color, 
            backgroundColor: statusDetails.bg,
            padding: '1px 5px',
            borderRadius: '3px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {statusDetails.label.toUpperCase()}
          </span>
          <strong>{pct}%</strong>
        </div>
        <wired-progress 
          value={pct} 
          style={{
            '--wired-progress-color': statusDetails.color,
            '--wired-progress-border-color': statusDetails.color
          } as React.CSSProperties}
        ></wired-progress>
        {torrent.status === 4 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            ETA: {formatETA(torrent.eta)}
          </div>
        )}
      </div>

      {/* Column 4: Speeds */}
      <div>
        {torrent.rateDownload > 0 && (
          <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ArrowDown size={13} />
            <span>{formatSpeed(torrent.rateDownload)}</span>
          </div>
        )}
        {torrent.rateUpload > 0 && (
          <div style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ArrowUp size={13} />
            <span>{formatSpeed(torrent.rateUpload)}</span>
          </div>
        )}
        {torrent.rateDownload === 0 && torrent.rateUpload === 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Idle</span>
        )}
      </div>

      {/* Column 5: Controls */}
      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
        {/* Play / Pause toggle */}
        {torrent.status === 0 ? (
          <wired-button 
            onClick={() => onAction(torrent.id, 'start')}
            style={{ minWidth: '32px', height: '32px', padding: '0', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
            title="Resume"
          >
            <Play size={14} fill="currentColor" />
          </wired-button>
        ) : (
          <wired-button 
            onClick={() => onAction(torrent.id, 'stop')}
            style={{ minWidth: '32px', height: '32px', padding: '0', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
            title="Pause"
          >
            <Pause size={14} fill="currentColor" />
          </wired-button>
        )}

        {/* Remove Button */}
        <wired-button 
          onClick={() => {
            const removeFiles = window.confirm(`Remove torrent "${torrent.name}"?\nChoose Cancel to KEEP files, or OK to also DELETE local data files.`);
            onAction(torrent.id, 'delete', removeFiles);
          }}
          style={{ 
            minWidth: '32px', 
            height: '32px', 
            padding: '0', 
            display: 'inline-flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            '--wired-button-border-color': 'var(--error-color)'
          } as React.CSSProperties}
          title="Remove"
        >
          <Trash2 size={14} style={{ color: 'var(--error-color)' }} />
        </wired-button>
      </div>
    </div>
  );
};
