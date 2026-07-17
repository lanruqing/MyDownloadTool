import React from 'react';
import type { Torrent } from '../types';
import { TorrentRow } from './TorrentRow';

interface TorrentListProps {
  torrents: Torrent[];
  loading: boolean;
  sortField: keyof Torrent;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: keyof Torrent) => void;
  onAction: (id: number, action: 'start' | 'stop' | 'delete', deleteLocalData?: boolean) => void;
}

export const TorrentList: React.FC<TorrentListProps> = ({
  torrents,
  loading,
  sortField,
  sortOrder,
  onSortChange,
  onAction,
}) => {
  const getSortIndicator = (field: keyof Torrent) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <main className="animate-draw" style={{ flexGrow: 1 }}>
      <wired-card style={{ width: '100%', padding: '1rem' }}>
        
        {/* Sorting Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          borderBottom: '2px dashed var(--primary-color)',
          paddingBottom: '0.8rem',
          marginBottom: '0.8rem',
          fontFamily: 'Architects Daughter, cursive',
          fontSize: '1rem',
          color: 'var(--primary-color)',
          textAlign: 'left'
        }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onSortChange('name')}>
            NAME{getSortIndicator('name')}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onSortChange('totalSize')}>
            SIZE{getSortIndicator('totalSize')}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onSortChange('percentDone')}>
            PROGRESS{getSortIndicator('percentDone')}
          </div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onSortChange('rateDownload')}>
            SPEEDS{getSortIndicator('rateDownload')}
          </div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>

        {/* Loader or Empty states */}
        {loading && torrents.length === 0 ? (
          <div className="spinner-container">
            <wired-spinner spinning={true}></wired-spinner>
            <span className="sketch-font" style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>Scanning Transfers...</span>
          </div>
        ) : torrents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }} className="sketch-font">
            --- No Torrents Match Current Filter ---
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {torrents.map((torrent) => (
              <TorrentRow 
                key={torrent.id} 
                torrent={torrent} 
                onAction={onAction} 
              />
            ))}
          </div>
        )}
      </wired-card>
    </main>
  );
};
