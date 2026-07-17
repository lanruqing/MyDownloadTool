import React from 'react';
import { formatBytes } from '../utils/formatters';

interface StatsFooterProps {
  downloadSpeed: number;
  uploadSpeed: number;
  downloadingCount: number;
  seedingCount: number;
  pausedCount: number;
  totalCount: number;
}

export const StatsFooter: React.FC<StatsFooterProps> = ({
  downloadSpeed,
  uploadSpeed,
  downloadingCount,
  seedingCount,
  pausedCount,
  totalCount,
}) => {
  return (
    <footer className="sketch-font animate-draw" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      borderTop: '2px dashed var(--primary-color)',
      paddingTop: '1rem',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem'
    }}>
      <div>
        <span>Total Transferred: </span>
        <span style={{ color: 'var(--text-primary)' }}>
          Down: {formatBytes(downloadSpeed)} // Up: {formatBytes(uploadSpeed)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <span>Active: <strong style={{ color: 'var(--primary-color)' }}>{downloadingCount}</strong></span>
        <span>Seeding: <strong style={{ color: 'var(--success-color)' }}>{seedingCount}</strong></span>
        <span>Paused: <strong style={{ color: 'var(--text-secondary)' }}>{pausedCount}</strong></span>
        <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong></span>
      </div>
    </footer>
  );
};
