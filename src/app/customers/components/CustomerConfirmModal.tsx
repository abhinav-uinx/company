'use client';

interface CustomerConfirmModalProps {
  isOpen: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CustomerConfirmModal({
  isOpen,
  count,
  onCancel,
  onConfirm
}: CustomerConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Confirm Deletion</h3>
        </div>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
          Are you sure you want to delete {count} customer(s)?<br/><br/>
          <b>Warning:</b> Deleting customer details will permanently delete all files (passports, tickets) related to them! This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
