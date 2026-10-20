'use client';

import { useState, useEffect } from 'react';

interface PendingReasonsModalProps {
  isOpen: boolean;
  reasons: string[];
  onReasonsChange: (reasons: string[]) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function PendingReasonsModal({
  isOpen,
  reasons,
  onReasonsChange,
  onCancel,
  onSave
}: PendingReasonsModalProps) {
  const [inputVal, setInputVal] = useState('');

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

  const handleAddReason = () => {
    if (inputVal.trim()) {
      onReasonsChange([...reasons, inputVal.trim()]);
      setInputVal('');
    }
  };

  const handleRemoveReason = (indexToRemove: number) => {
    onReasonsChange(reasons.filter((_, idx) => idx !== indexToRemove));
  };

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
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Enter Pending Reasons</h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '36px' }}>
          {reasons.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No reasons added yet. Type below and press Enter.
            </span>
          ) : (
            reasons.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#fef08a',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#854d0e',
                  fontWeight: 500
                }}
              >
                <span>{r}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveReason(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#854d0e',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    lineHeight: '1'
                  }}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddReason();
              }
            }}
            placeholder="Type a reason and press Enter..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          <button
            type="button"
            onClick={handleAddReason}
            style={{
              padding: '10px 16px',
              background: '#e2e8f0',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            Add
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              background: '#f1f5f9',
              color: '#475569',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: '9px 20px',
              background: '#0f172a',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Save Reasons
          </button>
        </div>
      </div>
    </div>
  );
}
