import React, { useState, useRef } from 'react';
import { X, Link2, FileText, Folder } from 'lucide-react';

interface AddTorrentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { file: File | null; url: string; downloadDir: string; paused: boolean }) => void;
  defaultDir: string;
  quickPaths: string[];
}

export const AddTorrentModal: React.FC<AddTorrentModalProps> = ({
  open,
  onClose,
  onSubmit,
  defaultDir,
  quickPaths,
}) => {
  const [torrentUrl, setTorrentUrl] = useState<string>('');
  const [customDownloadDir, setCustomDownloadDir] = useState<string>(defaultDir || '');
  const [addPaused, setAddPaused] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !torrentUrl.trim()) {
      alert('Please choose a .torrent file or paste a magnet/torrent link.');
      return;
    }
    onSubmit({
      file: selectedFile,
      url: torrentUrl.trim(),
      downloadDir: customDownloadDir.trim(),
      paused: addPaused,
    });
    
    // Reset state
    setTorrentUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>ADD NEW TORRENT</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Option A: Magnet Link */}
          <div>
            <label className="sketch-font" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              <Link2 size={14} /> MAGNET LINK or TORRENT URL
            </label>
            <wired-input 
              placeholder="magnet:?xt=urn:btih:..."
              value={torrentUrl}
              onChange={(e: any) => {
                setTorrentUrl(e.target.value);
                if (e.target.value) setSelectedFile(null); // Clear file choice
              }}
              style={{ width: '100%' }}
            ></wired-input>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem' }} className="sketch-font">
            - OR -
          </div>

          {/* Option B: Local Torrent Upload */}
          <div>
            <label className="sketch-font" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              <FileText size={14} /> SELECT LOCAL .TORRENT FILE
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <input 
                type="file" 
                accept=".torrent"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setTorrentUrl(''); // Clear URL choice
                  }
                }}
                style={{ display: 'none' }}
              />
              <wired-button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                CHOOSE FILE
              </wired-button>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', color: selectedFile ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px dashed rgba(255,255,255,0.1)' }} />

          {/* Custom Download Directory */}
          <div>
            <label className="sketch-font" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--warning-color)' }}>
              <Folder size={14} /> CUSTOM DOWNLOAD DIRECTORY
            </label>
            <wired-input 
              placeholder="/downloads"
              value={customDownloadDir}
              onChange={(e: any) => setCustomDownloadDir(e.target.value)}
            ></wired-input>

            {/* Quick Paths presets */}
            {quickPaths.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                <span className="sketch-font" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Quick Select Folder Preset:
                </span>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {quickPaths.map((path) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => setCustomDownloadDir(path)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.05)',
                        color: customDownloadDir === path ? 'var(--primary-color)' : 'var(--text-secondary)',
                        border: `1px ${customDownloadDir === path ? 'solid' : 'dashed'} var(--primary-color)`,
                        borderRadius: '3px',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        fontFamily: 'Outfit, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      {path.split('/').pop() || path}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Paused Checkbox */}
          <div>
            <wired-checkbox 
              checked={addPaused} 
              onChange={(e: any) => setAddPaused(e.target.checked)}
            >
              Add in paused state
            </wired-checkbox>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <wired-button 
              type="button"
              onClick={onClose}
              style={{ '--wired-button-border-color': 'var(--text-secondary)' } as React.CSSProperties}
            >
              CANCEL
            </wired-button>
            <wired-button 
              type="button"
              className="glow-success"
              onClick={handleFormSubmit}
              style={{ '--wired-button-background': 'rgba(74, 222, 128, 0.1)', '--wired-button-border-color': 'var(--success-color)' } as React.CSSProperties}
            >
              START DOWNLOAD
            </wired-button>
          </div>

        </form>
      </wired-card>
    </div>
  );
};
