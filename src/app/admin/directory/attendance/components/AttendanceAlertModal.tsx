'use client';

import { useEffect } from 'react';

interface AttendanceAlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function AttendanceAlertModal({
  isOpen,
  message,
  onClose
}: AttendanceAlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>error</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>Notice</h3>
        </div>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              background: '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
