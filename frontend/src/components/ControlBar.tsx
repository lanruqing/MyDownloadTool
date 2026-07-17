import React from 'react';
import { Plus, Settings, RefreshCw } from 'lucide-react';

interface ControlBarProps {
  onAddClick: () => void;
  onSettingsClick: () => void;
  onForceRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (val: boolean) => void;
  refreshInterval: number;
  onIntervalChange: (val: number) => void;
  filterStatus: string;
  onFilterChange: (val: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (val: string) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onAddClick,
  onSettingsClick,
  onForceRefresh,
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onIntervalChange,
  filterStatus,
  onFilterChange,
  filterCategory,
  onFilterCategoryChange,
}) => {
  return (
    <section className="animate-draw" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      
      {/* Left Side: Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <wired-button onClick={onAddClick} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Plus size={16} /> ADD TORRENT
        </wired-button>
        
        <wired-button onClick={onSettingsClick} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Settings size={16} /> DIRECTORY SETTINGS
        </wired-button>
        
        <wired-button onClick={onForceRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={16} /> FORCE REFRESH
        </wired-button>
      </div>

      {/* Right Side: Auto-refresh Toggle & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Auto Refresh Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>
          <wired-checkbox 
            checked={autoRefresh} 
            onChange={(e: any) => onAutoRefreshChange(e.target.checked)}
          >
            Auto-poll
          </wired-checkbox>

          <select 
            value={refreshInterval} 
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            style={{
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--primary-color)',
              borderRadius: '3px',
              padding: '2px 5px',
              fontSize: '0.85rem',
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer'
            }}
          >
            <option value={1000}>Every 1s</option>
            <option value={3000}>Every 3s</option>
            <option value={5000}>Every 5s</option>
            <option value={10000}>Every 10s</option>
          </select>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {['all', 'downloading', 'seeding', 'paused', 'finished'].map((status) => (
              <wired-button 
                key={status}
                onClick={() => onFilterChange(status)}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  backgroundColor: filterStatus === status ? 'rgba(56, 189, 248, 0.25)' : ''
                }}
              >
                {status.toUpperCase()}
              </wired-button>
            ))}
          </div>

          {/* Category Separator */}
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--primary-color)', opacity: 0.3, margin: '0 0.5rem' }} />

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {['all', 'series', 'movies', 'others'].map((category) => (
              <wired-button 
                key={category}
                onClick={() => onFilterCategoryChange(category)}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  backgroundColor: filterCategory === category ? 'rgba(139, 92, 246, 0.25)' : ''
                }}
              >
                {category.toUpperCase()}
              </wired-button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
