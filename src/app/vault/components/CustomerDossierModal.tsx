'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface CustomerDossierModalProps {
  selectedCustomer: any;
  customerPassports: any[];
  loadingPassports: boolean;
  uploadingMedif: boolean;
  onClose: () => void;
  onPreviewFile: (file: any) => void;
  onUploadMedif: (file: File, customerId: string) => void;
  onDeleteMedif: (filePath: string, customerId: string, bucket?: string) => void;
}

export default function CustomerDossierModal({
  selectedCustomer,
  customerPassports,
  loadingPassports,
  uploadingMedif,
  onClose,
  onPreviewFile,
  onUploadMedif,
  onDeleteMedif
}: CustomerDossierModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedCustomer) return null;

  // Extract customer services list
  const customerServiceNames: string[] = (() => {
    if (selectedCustomer?.servicesList && Array.isArray(selectedCustomer.servicesList) && selectedCustomer.servicesList.length > 0) {
      return selectedCustomer.servicesList;
    }
    let rawServices = selectedCustomer?.services || selectedCustomer?.doctor_reports_urls;
    if (typeof rawServices === 'string') {
      try {
        const parsed = JSON.parse(rawServices);
        if (Array.isArray(parsed)) rawServices = parsed;
      } catch {}
    }
    if (Array.isArray(rawServices) && rawServices.length > 0) {
      return rawServices;
    }
    if (selectedCustomer?.serviceName && selectedCustomer.serviceName !== 'Unassigned') {
      return [selectedCustomer.serviceName];
    }
    return [];
  })();

  const isMedical = (name: string) => name.toLowerCase().includes('medical');

  const totalInvoiced = Number(selectedCustomer.totalAmount) || 0;
  const totalPaid = Number(selectedCustomer.totalAdvance) || 0;
  const totalBalance = Number(selectedCustomer.totalBalance) || 0;
  const paymentStatus = selectedCustomer.paymentStatus || 'No Invoice';

  const badgeColors: Record<string, { bg: string; color: string; border: string }> = {
    'Paid': { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    'Partially Paid': { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    'Unpaid': { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
    'No Invoice': { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
  };
  const activeBadge = badgeColors[paymentStatus] || badgeColors['No Invoice'];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .dossier-overlay {
            padding: 8px !important;
          }
          .dossier-modal-container {
            max-height: 96vh !important;
            border-radius: 14px !important;
            width: 100% !important;
          }
          .dossier-modal-header {
            padding: 14px 16px !important;
          }
          .dossier-modal-body {
            padding: 14px 12px !important;
            gap: 14px !important;
          }
          .dossier-modal-footer {
            padding: 12px 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .dossier-footer-actions {
            display: flex !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .dossier-footer-actions > * {
            flex: 1 1 50% !important;
            justify-content: center !important;
            padding: 12px !important;
          }
          .dossier-2col {
            grid-template-columns: 1fr !important;
          }
          .dossier-span2 {
            grid-column: span 1 !important;
          }
        }
      `}} />
      <div
        className="dossier-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <div
          className="dossier-modal-container hide-scrollbar"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Clean white style matching /customers */}
          <div
            className="dossier-modal-header"
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#ffffff',
              zIndex: 10,
              flexShrink: 0
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
                  {selectedCustomer.name}
                </h2>
              {customerServiceNames.map((name: string, i: number) => {
                const med = isMedical(name);
                return (
                  <span
                    key={i}
                    style={{
                      background: med ? '#e0e7ff' : '#e0f2fe',
                      color: med ? '#4338ca' : '#0369a1',
                      border: med ? '1px solid #c7d2fe' : '1px solid #bae6fd',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Customer ID: <span style={{ fontFamily: 'monospace', color: '#475569' }}>{selectedCustomer.id}</span>
              {selectedCustomer.created_at && (
                <> &middot; Created on {new Date(selectedCustomer.created_at).toLocaleDateString()}</>
              )}
            </p>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'background 0.15s'
            }}
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          className="dossier-modal-body hide-scrollbar"
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* 1. Payment & Invoicing Details */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '20px' }}>payments</span>
                Payment &amp; Invoicing Details
              </div>
              <span
                style={{
                  background: activeBadge.bg,
                  color: activeBadge.color,
                  border: `1px solid ${activeBadge.border}`,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {paymentStatus}
              </span>
            </div>

            {/* 4 Financial KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Payment Status</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: activeBadge.color, fontWeight: 700, fontSize: '0.9rem' }}>
                    {paymentStatus}
                  </span>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Invoiced</div>
                <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Advance / Paid</div>
                <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Balance</div>
                <div style={{ color: totalBalance > 0 ? '#e11d48' : '#059669', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Invoices List */}
            {selectedCustomer.custInvoices && selectedCustomer.custInvoices.length > 0 ? (
              <div style={{ marginTop: '10px', background: '#ffffff', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#2563eb' }}>receipt_long</span>
                  Invoices Generated ({selectedCustomer.custInvoices.length}):
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedCustomer.custInvoices.map((inv: any, idx: number) => (
                    <div
                      key={inv.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9',
                        fontSize: '12px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <strong>Invoice #{inv.id.substring(0, 8)}</strong> &middot;{' '}
                        <span style={{ color: '#64748b' }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Subtotal: ${inv.subtotal} | Tax/VAT: {inv.tax_vat_percent}% | Disc: ${inv.discount}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>Total: ${inv.total_amount}</span>{' '}
                          <span style={{ color: '#64748b', fontSize: '11px' }}>(Bal: ${inv.balance_amount})</span>
                        </div>
                        <Link
                          href={`/invoices/${inv.id}`}
                          style={{
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          View Bill &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', background: '#ffffff', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                No invoice generated yet for this customer.
              </div>
            )}

            {/* Payment Receipts / History */}
            {selectedCustomer.custPayments && selectedCustomer.custPayments.length > 0 && (
              <div style={{ marginTop: '10px', background: '#ecfdf5', borderRadius: '8px', padding: '10px 12px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  Payment Receipts / History ({selectedCustomer.custPayments.length}):
                </div>
                {selectedCustomer.custPayments.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      padding: '4px 0',
                      color: '#065f46',
                      borderBottom: idx !== selectedCustomer.custPayments.length - 1 ? '1px dashed #bbf7d0' : 'none'
                    }}
                  >
                    <span>
                      <strong>${p.amount}</strong> &middot; {p.payment_method || 'Direct'} &middot; {p.remarks || 'Receipt logged'}
                    </span>
                    <span>{new Date(p.payment_date || Date.now()).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Personal & Identity Information */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px' }}>badge</span>
              Personal &amp; Identity Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Service Type(s)</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {customerServiceNames.length > 0 ? (
                    customerServiceNames.map((name: string, i: number) => {
                      const med = isMedical(name);
                      return (
                        <span
                          key={i}
                          style={{
                            background: med ? '#e0e7ff' : '#e0f2fe',
                            color: med ? '#4338ca' : '#0369a1',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {name}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Full Name</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{selectedCustomer.name || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Iqama Number</div>
                <div style={{ color: '#0f172a', fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedCustomer.iqama_number || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Passport Number</div>
                <div style={{ color: '#0f172a', fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedCustomer.passport_no || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Passport Expiry</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>
                  {selectedCustomer.passport_expiry || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nationality</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.nationality || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date of Birth (DOB)</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.dob || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Contact Phone</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.contact_number || 'N/A'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Email Address</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.email || 'N/A'}</div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Address</div>
                <div style={{ color: '#0f172a', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {selectedCustomer.address || 'N/A'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Origin / Home Country Address</div>
                <div style={{ color: '#0f172a', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {selectedCustomer.origin_address || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Emergency Contacts */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '20px' }}>emergency</span>
              Emergency Contacts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emergency Contact Name</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.emergency_contact_name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emergency Phone Number</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.emergency_contact_phone || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* 4. Medical & Clinical Information */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>medical_services</span>
              Medical &amp; Clinical Information
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Hospital</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.current_hospital || 'Not Specified'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Medical Condition / Diagnosis</div>
                <div
                  style={{
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginTop: '4px',
                    minHeight: '50px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedCustomer.medical_condition || 'No clinical condition specified.'}
                </div>
              </div>

              {selectedCustomer.fitness_to_fly_url && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fitness to Fly Document</div>
                  <a
                    href={selectedCustomer.fitness_to_fly_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                    View Clearance Certificate &rarr;
                  </a>
                </div>
              )}

              {selectedCustomer.nurse && (
                <div style={{ marginTop: '4px', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Assigned Medical Escort
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedCustomer.nurse.name}{' '}
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      ({selectedCustomer.nurse.job_title || 'Medical Escort'})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Visa & Travel Documentation */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: '20px' }}>flight</span>
              Visa &amp; Travel Documentation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa Number</div>
                <div style={{ color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>
                  {selectedCustomer.visa_no || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa Type</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.visa_type || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa Country</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.visa_country || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa Expiry</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{selectedCustomer.visa_expiry || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* 6. Escort Missions & Flight Records (if present) */}
          {selectedCustomer.custMissions && selectedCustomer.custMissions.length > 0 && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '20px' }}>connecting_airports</span>
                  Escort Missions &amp; Flight Records
                </div>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                  {selectedCustomer.custMissions.length} {selectedCustomer.custMissions.length === 1 ? 'Flight' : 'Flights'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {selectedCustomer.custMissions.map((m: any, idx: number) => (
                  <div
                    key={m.id || idx}
                    style={{
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Route</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.from_country} &rarr; {m.to_country}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Flight &amp; Airline</div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.airline} {m.flight_no}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>PNR &amp; Date</div>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>
                        {m.pnr || 'N/A'} ({m.flight_date || 'N/A'})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Status</div>
                      <div style={{ fontWeight: 600, color: '#0284c7' }}>{m.status}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Assigned Escort</div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                        {m.escort_employee_iqama || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Passport Documents Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>passkey</span>
              Customer Passports ({customerPassports?.length || 0})
            </div>

            {loadingPassports ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Loading passport files...
              </div>
            ) : customerPassports && customerPassports.length > 0 ? (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {customerPassports.map((file: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => onPreviewFile(file)}
                    style={{
                      width: '120px',
                      height: '160px',
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transition: 'transform 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ flex: 1, position: 'relative', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {file.type?.includes('image') ? (
                        <img src={file.data || file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="passport" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ef4444' }}>picture_as_pdf</span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '8px',
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#334155',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No passport files uploaded in storage for this customer.
              </div>
            )}
          </div>

          {/* 8. Attached MEDIF Clearance Files Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '20px' }}>folder_shared</span>
                MEDIF Clearance Forms ({(selectedCustomer.medifFiles || []).length})
              </div>

              <label
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: uploadingMedif ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: uploadingMedif ? 0.7 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
                {uploadingMedif ? 'Uploading...' : 'Upload MEDIF Form'}
                <input
                  type="file"
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  disabled={uploadingMedif}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadMedif(file, selectedCustomer.id);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {selectedCustomer.medifFiles && selectedCustomer.medifFiles.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedCustomer.medifFiles.map((file: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#0284c7' }}>
                        description
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{file.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Uploaded {new Date(file.created_at || Date.now()).toLocaleDateString()}
                          {file.size ? ` · ${(file.size / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                        Preview
                      </button>

                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
                        Download
                      </a>

                      <button
                        type="button"
                        onClick={() => onDeleteMedif(file.path, selectedCustomer.id, file.bucket || 'medical_escort')}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Delete MEDIF file"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No MEDIF forms uploaded yet. Use the &quot;Upload MEDIF Form&quot; button above to attach one.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer - Identical to /customers view modal */}
        <div
          className="dossier-modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>verified</span>
            All details verified &amp; synced from database
          </div>

          <div className="dossier-footer-actions" style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={`/customers/${selectedCustomer.id}`}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                fontSize: '13px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
              Edit Customer
            </Link>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
