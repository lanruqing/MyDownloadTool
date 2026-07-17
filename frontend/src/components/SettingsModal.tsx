import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  defaultDir: string;
  onUpdateDefaultDir: (dir: string) => void;
  quickPaths: string[];
  onAddQuickPath: (path: string) => void;
  onRemoveQuickPath: (path: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  defaultDir,
  onUpdateDefaultDir,
  quickPaths,
  onAddQuickPath,
  onRemoveQuickPath,
}) => {
  const [downloadDirInput, setDownloadDirInput] = useState<string>(defaultDir);
  const [newQuickPath, setNewQuickPath] = useState<string>('');

  if (!open) return null;

  const handleUpdateDirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadDirInput.trim()) return;
    onUpdateDefaultDir(downloadDirInput.trim());
  };

  const handleAddQuickPathClick = () => {
    if (!newQuickPath.trim()) return;
    onAddQuickPath(newQuickPath.trim());
    setNewQuickPath('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 20, 38, 0.85)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999
    }}>
      <wired-card className="glow-primary animate-draw" style={{ width: '90%', maxWidth: '600px', padding: '1.5rem', backgroundColor: 'var(--bg-color)' }}>
        
        {/* Modal Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>DIRECTORY CONFIGURATION</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section A: Default Global Directory */}
        <form onSubmit={handleUpdateDirSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--warning-color)' }}>Global Transmission Settings</h3>
          <div>
            <label className="sketch-font" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Default Download Directory on Daemon
            </label>
            <wired-input 
              value={downloadDirInput}
              onChange={(e: any) => setDownloadDirInput(e.target.value)}
            ></wired-input>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <wired-button type="submit">
              SAVE GLOBAL PATH
            </wired-button>
          </div>
        </form>

        <hr style={{ border: '0', borderTop: '1px dashed rgba(255,255,255,0.1)', marginBottom: '1.2rem' }} />

        {/* Section B: Custom Quick-Pick presets list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--warning-color)' }}>Manage Quick-Pick Folder Presets</h3>
          <p className="sketch-font" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Customize directories to quickly choose from when adding new torrents.
          </p>

          {/* Input for new preset */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <wired-input 
              placeholder="/downloads/custom-category" 
              value={newQuickPath}
              onChange={(e: any) => setNewQuickPath(e.target.value)}
              style={{ flexGrow: 1 }}
            ></wired-input>
            <wired-button type="button" onClick={handleAddQuickPathClick}>
              ADD PRESET
            </wired-button>
          </div>

          {/* List of presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {quickPaths.map((path) => (
              <div 
                key={path}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.3rem 0.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '3px',
                  fontSize: '0.85rem'
                }}
              >
                <span>{path}</span>
                <button
                  type="button"
                  onClick={() => onRemoveQuickPath(path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <wired-button onClick={onClose}>
            CLOSE
          </wired-button>
        </div>

      </wired-card>
    </div>
  );
};
