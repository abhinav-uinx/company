'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';

interface GeneralServiceDetailsModalProps {
  viewCustomer: any;
  docTypes: any[];
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export default function GeneralServiceDetailsModal({
  viewCustomer,
  docTypes,
  onClose,
  onStatusChange
}: GeneralServiceDetailsModalProps) {
  const [customerDetails, setCustomerDetails] = useState<any>(viewCustomer?.customers || null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Ensure full customer data (phone number, iqama number, etc.) is loaded even with stale cache
  useEffect(() => {
    setCustomerDetails(viewCustomer?.customers || null);
    if (viewCustomer?.customer_id && (!viewCustomer.customers?.iqama_number || !viewCustomer.customers?.contact_number)) {
      supabaseAuth
        .from('customers')
        .select('id, name, contact_number, iqama_number, nationality, passport_no, email, address')
        .eq('id', viewCustomer.customer_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCustomerDetails(data);
          }
        });
    }
  }, [viewCustomer]);

  if (!viewCustomer) return null;

  const phone = customerDetails?.contact_number || customerDetails?.phone_number || '-';
  const iqama = customerDetails?.iqama_number || '-';
  const nationality = customerDetails?.nationality || '-';
  const passport = customerDetails?.passport_no || '-';
  const customerName = customerDetails?.name || viewCustomer.customers?.name || 'Customer';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .doc-modal-overlay {
            padding: 8px !important;
          }
          .doc-modal-container {
            width: 100% !important;
            max-height: 95vh !important;
            border-radius: 14px !important;
          }
          .doc-modal-header {
            padding: 14px 16px !important;
          }
          .doc-modal-body {
            padding: 14px 12px !important;
            gap: 14px !important;
          }
          .doc-modal-footer {
            padding: 12px 14px !important;
            gap: 8px !important;
          }
          .doc-modal-footer > * {
            flex: 1 !important;
            justify-content: center !important;
            text-align: center !important;
          }
          .doc-info-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}} />
      <div
        className="doc-modal-overlay"
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
          className="doc-modal-container hide-scrollbar"
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
            className="doc-modal-header"
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
              <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                Customer: <span style={{ fontWeight: 600, color: '#0369a1' }}>{customerName}</span>
                {iqama !== '-' && (
                  <> &middot; Iqama: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{iqama}</span></>
                )}
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
        <div className="doc-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              Personal Info &amp; Identification
            </h3>
            <div className="doc-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* Phone Number */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#10b981' }}>call</span>
                  Phone Number
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{phone}</div>
              </div>

              {/* Iqama Number */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#3b82f6' }}>badge</span>
                  Iqama Number
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {iqama}
                </div>
              </div>

              {/* Nationality */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#f59e0b' }}>flag</span>
                  Nationality
                </div>
                <div style={{ fontWeight: 500, color: '#0f172a' }}>{nationality}</div>
              </div>

              {/* Status */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#8b5cf6' }}>check_circle</span>
                  Status
                </div>
                {(() => {
                  const isDone = (viewCustomer.status || '').toLowerCase() === 'done' || (viewCustomer.status || '').toLowerCase() === 'completed';
                  return (
                    <div
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '9999px',
                        padding: '3px 8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        background: isDone ? '#ecfdf5' : '#fffbeb',
                        border: `1px solid ${isDone ? '#a7f3d0' : '#fde68a'}`,
                        color: isDone ? '#065f46' : '#92400e',
                        userSelect: 'none'
                      }}
                      title="Click to change status"
                    >
                      {isDone ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#059669', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : null}
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1 }}>
                        {isDone ? 'Done' : 'Pending'}
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '13px',
                          opacity: 0.7,
                          marginLeft: '0px'
                        }}
                      >
                        expand_more
                      </span>

                      {/* Full-coverage native select overlay */}
                      <select
                        value={isDone ? 'Done' : 'Pending'}
                        onChange={(e) => onStatusChange?.(viewCustomer.id, e.target.value)}
                        aria-label="Change status"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  );
                })()}
              </div>

              {/* Passport Number if present */}
              {passport !== '-' && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#8b5cf6' }}>passkey</span>
                    Passport Number
                  </div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{passport}</div>
                </div>
              )}

              {/* Target Date if present */}
              {viewCustomer.target_date && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#ec4899' }}>event</span>
                    Target Completion Date
                  </div>
                  <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewCustomer.target_date}</div>
                </div>
              )}
            </div>
          </div>

          {/* Requested Documents */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0284c7' }}>description</span>
              Requested Documents &amp; Services
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
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
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No specific documents specified.</span>
              )}
            </div>
          </div>

          {/* Remarks if present */}
          {viewCustomer.remarks && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>notes</span>
                Remarks / Special Instructions
              </div>
              <div style={{ color: '#0f172a', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {viewCustomer.remarks}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="doc-modal-footer"
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
              background: '#eff6ff',
              color: '#2563eb',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            Edit Request
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
  </>
  );
}
