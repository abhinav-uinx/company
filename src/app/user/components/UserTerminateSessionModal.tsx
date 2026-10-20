'use client';

import { useEffect } from 'react';

interface UserTerminateSessionModalProps {
  isOpen: boolean;
  isCurrentSession: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function UserTerminateSessionModal({
  isOpen,
  isCurrentSession,
  onCancel,
  onConfirm
}: UserTerminateSessionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>Terminate Session</h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
          Are you sure you want to terminate this session?
          <br /><br />
          {isCurrentSession ? (
            <strong style={{ color: '#ef4444' }}>This will immediately log you out from your current device.</strong>
          ) : (
            <span>This device will be immediately signed out and require login credentials again.</span>
          )}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 16px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Terminate
          </button>
        </div>
      </div>
    </div>
  );
}
