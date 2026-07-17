import React from 'react';
import { ArrowDown, ArrowUp, HardDrive } from 'lucide-react';
import { formatSpeed, formatBytes } from '../utils/formatters';

interface HeaderProps {
  version?: string;
  downloadSpeed: number;
  uploadSpeed: number;
  freeSpace: number;
}

export const Header: React.FC<HeaderProps> = ({
  version,
  downloadSpeed,
  uploadSpeed,
  freeSpace,
}) => {
  return (
    <header className="animate-draw" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px dashed var(--primary-color)', paddingBottom: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', textShadow: '0 0 10px var(--primary-glow)' }}>
          TRANSMISSION // BLUEPRINT
        </h1>
        <p className="sketch-font" style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Hand-Drawn Control Board // Daemon: {version || 'checking...'}
        </p>
      </div>

      {/* Global Stats Widgets */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <wired-card className="glow-primary" style={{ padding: '0.5rem 1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-color)' }}>
              <ArrowDown size={16} />
              <strong>{formatSpeed(downloadSpeed)}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success-color)' }}>
              <ArrowUp size={16} />
              <strong>{formatSpeed(uploadSpeed)}</strong>
            </div>
          </div>
        </wired-card>

        <wired-card style={{ padding: '0.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <HardDrive size={16} style={{ color: 'var(--warning-color)' }} />
            <span>Free Space: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{freeSpace >= 0 ? formatBytes(freeSpace) : 'N/A'}</strong>
          </div>
        </wired-card>
      </div>
    </header>
  );
};
