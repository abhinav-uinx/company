'use client';

import { useEffect } from 'react';

interface NurseDetailsModalProps {
  selectedNurse: any;
  onClose: () => void;
}

export default function NurseDetailsModal({ selectedNurse, onClose }: NurseDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedNurse) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'zoomIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div style={{
          padding: '26px 28px',
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          color: '#ffffff',
          position: 'relative',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              width: '32px', height: '32px', borderRadius: '50%',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, color: '#fff',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
              border: '3px solid rgba(255, 255, 255, 0.4)',
              overflow: 'hidden', flexShrink: 0
            }}>
              {selectedNurse.photo_url ? (
                <img src={selectedNurse.photo_url} alt={selectedNurse.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (selectedNurse.name || 'N').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{selectedNurse.name}</h3>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)', color: '#a7f3d0',
                  padding: '2px 8px', borderRadius: '999px', fontSize: '11px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  {selectedNurse.status || 'Active'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#a7f3d0', fontSize: '13px', fontWeight: 500 }}>
                {selectedNurse.job_title || 'Flight Nurse / Medical Escort'}
              </p>
            </div>
          </div>
        </div>

        {/* Nurse Info List */}
        <div style={{ padding: '24px 28px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Iqama / Civil ID</span>
              <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                {selectedNurse.iqama_number || 'N/A'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                {selectedNurse.department || 'Clinical Operations / Nursing'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Contact Phone</span>
              {selectedNurse.phone_number ? (
                <a href={`tel:${selectedNurse.phone_number}`} style={{ fontSize: '14px', fontWeight: 700, color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                  {selectedNurse.phone_number}
                </a>
              ) : (
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Not Provided</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email Address</span>
              {selectedNurse.email ? (
                <a href={`mailto:${selectedNurse.email}`} style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                  {selectedNurse.email}
                </a>
              ) : (
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Not Provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#064e3b', color: '#ffffff', border: 'none',
              padding: '9px 24px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
