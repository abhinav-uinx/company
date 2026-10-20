'use client';

import { useState, useEffect } from 'react';

interface RecordPaymentModalProps {
  paymentModal: any;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
}

export default function RecordPaymentModal({
  paymentModal,
  onClose,
  onConfirm
}: RecordPaymentModalProps) {
  const [paymentAmt, setPaymentAmt] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (paymentModal) {
      setPaymentAmt(paymentModal.balance_amount || 0);
    }
  }, [paymentModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!paymentModal) return null;

  const handleSubmit = async () => {
    if (paymentAmt <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(paymentAmt);
    } finally {
      setSubmitting(false);
    }
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          padding: '28px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '28px' }}>payments</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Record Payment</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Balance</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
            ${paymentModal.balance_amount}
          </div>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Payment Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={paymentAmt || ''}
            onChange={(e) => setPaymentAmt(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '9px 20px',
              background: '#16a34a',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: submitting ? 0.7 : 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
            {submitting ? 'Recording...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
