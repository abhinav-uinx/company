'use client';

import { useEffect } from 'react';

interface FullscreenFileViewerProps {
  file: any;
  onClose: () => void;
  onShare?: (file: any) => void;
}

export default function FullscreenFileViewer({
  file,
  onClose,
  onShare
}: FullscreenFileViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const fileSource = file.url || file.data;
  const isImage = file.type ? file.type.includes('image') : (
    typeof fileSource === 'string' && (
      fileSource.includes('image') ||
      fileSource.endsWith('.png') ||
      fileSource.endsWith('.jpg') ||
      fileSource.endsWith('.jpeg') ||
      fileSource.endsWith('.webp')
    )
  );

  const handleDefaultShare = async () => {
    if (onShare) {
      onShare(file);
      return;
    }
    try {
      const res = await fetch(fileSource);
      const blob = await res.blob();
      const fileObj = new File([blob], file.name || 'document', { type: file.type || 'application/octet-stream' });
      if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: file.name || 'Document',
          text: 'Document Attachment'
        });
        return;
      }
    } catch {
      // Fallback to direct download
    }
    const link = document.createElement('a');
    link.href = fileSource;
    link.download = file.name || 'document';
    link.target = '_blank';
    link.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          color: '#ffffff',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          boxSizing: 'border-box',
          zIndex: 10
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name || 'Document Preview'}
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDefaultShare}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
            Share / Download
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          height: '80%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '50px'
        }}
      >
        {isImage ? (
          <img
            src={fileSource}
            alt={file.name || 'Fullscreen preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}
          />
        ) : (
          <iframe
            src={fileSource}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
            }}
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
}
