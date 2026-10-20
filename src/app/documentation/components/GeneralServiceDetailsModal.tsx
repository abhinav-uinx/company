'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface GeneralServiceDetailsModalProps {
  viewCustomer: any;
  docTypes: any[];
  onClose: () => void;
}

export default function GeneralServiceDetailsModal({
  viewCustomer,
  docTypes,
  onClose
}: GeneralServiceDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!viewCustomer) return null;

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
        className="hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined">folder_shared</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>General Service Details</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                Customer: <span style={{ fontWeight: 600, color: '#0369a1' }}>{viewCustomer.customers?.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3
              style={{
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                margin: '0 0 12px 0',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '8px'
              }}
            >
              Personal Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Nationality</div>
                <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewCustomer.customers?.nationality || '-'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Contact Number</div>
                <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewCustomer.customers?.contact_number || '-'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Requested Documents</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {viewCustomer.service_ids && viewCustomer.service_ids.length > 0 ? (
                    viewCustomer.service_ids.map((id: string) => {
                      const name = docTypes.find((d) => d.id === id)?.name;
                      return name ? (
                        <span
                          key={id}
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            border: '1px solid #bae6fd'
                          }}
                        >
                          {name}
                        </span>
                      ) : null;
                    })
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No documents requested.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <Link
            href={`/documentation/${viewCustomer.id}`}
            style={{
              padding: '10px 20px',
              background: '#e2e8f0',
              color: '#0f172a',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Edit Customer
          </Link>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#0f172a',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
