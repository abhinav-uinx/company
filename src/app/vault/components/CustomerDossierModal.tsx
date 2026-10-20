'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [activeSection, setActiveSection] = useState('billing');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Smooth scroll to target section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const container = modalBodyRef.current;
    if (!container) return;
    const target = container.querySelector(`#section-${sectionId}`) as HTMLElement;
    if (target) {
      const topOffset = target.offsetTop - 8;
      container.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('billing');
  };

  const handleModalScroll = () => {
    const container = modalBodyRef.current;
    if (!container) return;

    setShowScrollTop(container.scrollTop > 220);

    const sectionIds = ['billing', 'identity', 'visa', 'emergency', 'medical', 'missions', 'documents'];
    const currentScroll = container.scrollTop + 90;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const el = container.querySelector(`#section-${sectionIds[i]}`) as HTMLElement;
      if (el && el.offsetTop <= currentScroll) {
        setActiveSection(sectionIds[i]);
        break;
      }
    }
  };

  if (!selectedCustomer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F5DFF 0%, #6366F1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '19px', fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(79, 93, 255, 0.4)'
            }}>
              {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>{selectedCustomer.name}</h2>
                {selectedCustomer.servicesList && selectedCustomer.servicesList.length > 0 ? (
                  selectedCustomer.servicesList.map((sName: string, i: number) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                      {sName}
                    </span>
                  ))
                ) : (
                  <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                    {selectedCustomer.serviceName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                Customer ID: <span style={{ fontFamily: 'monospace' }}>{selectedCustomer.id}</span> &middot; Created on {new Date(selectedCustomer.created_at || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Sticky Navigation Subnav */}
        <div className="modal-subnav">
          <div className="subnav-tabs">
            {[
              { id: 'billing', label: 'Financial & Invoices', icon: 'payments', badge: selectedCustomer.custInvoices?.length },
              { id: 'identity', label: 'Personal & Identity', icon: 'badge' },
              { id: 'visa', label: 'Visa & Travel', icon: 'flight' },
              { id: 'emergency', label: 'Emergency Contact', icon: 'emergency' },
              { id: 'medical', label: 'Medical & Clinical', icon: 'medical_services' },
              ...(selectedCustomer.custMissions && selectedCustomer.custMissions.length > 0 ? [
                { id: 'missions', label: 'Missions & Flights', icon: 'connecting_airports', badge: selectedCustomer.custMissions.length }
              ] : []),
              { id: 'documents', label: 'Vault Files & Passports', icon: 'folder_shared', badge: (selectedCustomer.medifFiles?.length || 0) + (customerPassports?.length || 0) },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`subnav-tab-btn ${activeSection === tab.id ? 'active' : ''}`}
                onClick={() => scrollToSection(tab.id)}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="subnav-tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          ref={modalBodyRef}
          onScroll={handleModalScroll}
        >

          {/* 1. FINANCIAL & PAYMENT INFO */}
          <div id="section-billing" className="modal-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Payment &amp; Invoicing Details</h3>
                  <p className="section-sub-desc">Financial ledger, invoice breakdown, and logged payment receipts</p>
                </div>
              </div>
              <span className={`badge ${selectedCustomer.paymentStatus === 'Paid' ? 'badge-paid' : selectedCustomer.paymentStatus === 'Partially Paid' ? 'badge-partial' : selectedCustomer.paymentStatus === 'Unpaid' ? 'badge-unpaid' : 'badge-noinv'}`}>
                {selectedCustomer.paymentStatus}
              </span>
            </div>

            <div className="financial-kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Payment Status</span>
                <span className="kpi-value" style={{ marginTop: '2px' }}>
                  <span className={`badge ${selectedCustomer.paymentStatus === 'Paid' ? 'badge-paid' : selectedCustomer.paymentStatus === 'Partially Paid' ? 'badge-partial' : selectedCustomer.paymentStatus === 'Unpaid' ? 'badge-unpaid' : 'badge-noinv'}`}>
                    {selectedCustomer.paymentStatus}
                  </span>
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Total Invoiced</span>
                <span className="kpi-value text-slate">
                  ${selectedCustomer.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Advance / Paid</span>
                <span className="kpi-value text-emerald">
                  ${selectedCustomer.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Remaining Balance</span>
                <span className={`kpi-value ${selectedCustomer.totalBalance > 0 ? 'text-rose' : 'text-emerald'}`}>
                  ${selectedCustomer.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Invoices List */}
            {selectedCustomer.custInvoices && selectedCustomer.custInvoices.length > 0 ? (
              <div style={{ marginTop: '14px', background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4F5DFF' }}>receipt_long</span>
                  Invoices Generated ({selectedCustomer.custInvoices.length}):
                </div>
                {selectedCustomer.custInvoices.map((inv: any, idx: number) => (
                  <div key={inv.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx !== selectedCustomer.custInvoices.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: '13px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>Invoice #{inv.id.substring(0, 8)}</strong> &middot;{' '}
                      <span style={{ color: '#64748b' }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Subtotal: ${inv.subtotal} | Tax/VAT: {inv.tax_vat_percent}% | Disc: ${inv.discount}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total: ${inv.total_amount}</span>{' '}
                        <span style={{ color: '#64748b', fontSize: '12px' }}>(Bal: ${inv.balance_amount})</span>
                      </div>
                      <Link href={`/invoices/${inv.id}`} style={{ color: '#4F5DFF', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EEF1FF', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        View Bill &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                No invoice generated yet for this customer.
              </div>
            )}

            {/* Logged Payment Transactions */}
            {selectedCustomer.custPayments && selectedCustomer.custPayments.length > 0 && (
              <div style={{ marginTop: '14px', background: '#ecfdf5', borderRadius: '10px', padding: '14px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  Payment Receipts / History ({selectedCustomer.custPayments.length}):
                </div>
                {selectedCustomer.custPayments.map((p: any, idx: number) => (
                  <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', color: '#065f46', borderBottom: idx !== selectedCustomer.custPayments.length - 1 ? '1px dashed #bbf7d0' : 'none' }}>
                    <span>
                      <strong>${p.amount}</strong> &middot; {p.payment_method || 'Direct'} &middot; {p.remarks || 'Receipt logged'}
                    </span>
                    <span>{new Date(p.payment_date || Date.now()).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. PRIMARY IDENTITY & CONTACT */}
          <div id="section-identity" className="modal-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#eef2ff', color: '#4F5DFF', borderColor: '#c7d2fe' }}>
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Personal &amp; Identity Information</h3>
                  <p className="section-sub-desc">Primary government identity numbers, age, and contact channels</p>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Service Type(s)</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {selectedCustomer.servicesList && selectedCustomer.servicesList.length > 0 ? (
                    selectedCustomer.servicesList.map((sName: string, i: number) => {
                      const isMed = sName.toLowerCase().includes('medical');
                      return (
                        <span
                          key={i}
                          style={{
                            background: isMed ? '#e0e7ff' : '#e0f2fe',
                            color: isMed ? '#4338ca' : '#0369a1',
                            border: isMed ? '1px solid #c7d2fe' : '1px solid #bae6fd',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            {isMed ? 'medical_services' : 'folder_shared'}
                          </span>
                          {sName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="info-val">{selectedCustomer.serviceName || 'Unassigned'}</span>
                  )}
                </div>
              </div>
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-val">{selectedCustomer.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Iqama Number</span>
                <span className="info-val mono">{selectedCustomer.iqama_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Passport Number</span>
                <span className="info-val mono">{selectedCustomer.passport_no || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Passport Expiry</span>
                <span className="info-val">{selectedCustomer.passport_expiry || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nationality</span>
                <span className="info-val">{selectedCustomer.nationality || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date of Birth (DOB)</span>
                <span className="info-val">{selectedCustomer.dob || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact Phone</span>
                <span className="info-val">{selectedCustomer.contact_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-val">{selectedCustomer.email || 'N/A'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Current Address</span>
                <span className="info-val">{selectedCustomer.address || 'N/A'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Origin / Home Country Address</span>
                <span className="info-val">{selectedCustomer.origin_address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 3. VISA & IMMIGRATION DETAILS */}
          <div id="section-visa" className="modal-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                  <span className="material-symbols-outlined">flight</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Visa &amp; Travel Documentation</h3>
                  <p className="section-sub-desc">Immigration permissions, visa numbers, and validity periods</p>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Visa Number</span>
                <span className="info-val mono">{selectedCustomer.visa_no || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Visa Type</span>
                <span className="info-val">{selectedCustomer.visa_type || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Visa Country</span>
                <span className="info-val">{selectedCustomer.visa_country || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Visa Expiry</span>
                <span className="info-val">{selectedCustomer.visa_expiry || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 4. EMERGENCY CONTACTS */}
          <div id="section-emergency" className="modal-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                  <span className="material-symbols-outlined">emergency</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Emergency Contacts</h3>
                  <p className="section-sub-desc">Designated family or legal point of contact</p>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Emergency Contact Name</span>
                <span className="info-val">{selectedCustomer.emergency_contact_name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Emergency Phone Number</span>
                <span className="info-val">{selectedCustomer.emergency_contact_phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 5. MEDICAL INFORMATION */}
          <div id="section-medical" className="modal-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}>
                  <span className="material-symbols-outlined">medical_services</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Medical &amp; Clinical Information</h3>
                  <p className="section-sub-desc">Hospital location, clinical diagnosis, and fitness to fly certifications</p>
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Current Hospital</span>
                <span className="info-val">{selectedCustomer.current_hospital || 'Not Specified'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Medical Condition / Diagnosis</span>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedCustomer.medical_condition || 'No clinical condition specified.'}
                </div>
              </div>
              {selectedCustomer.fitness_to_fly_url && (
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-label">Fitness To Fly Document</span>
                  <a href={selectedCustomer.fitness_to_fly_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    Open Fitness to Fly Document &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 6. ESCORT MISSIONS & OPERATIONAL SERVICE DATA */}
          {selectedCustomer.custMissions && selectedCustomer.custMissions.length > 0 && (
            <div id="section-missions" className="modal-section">
              <div className="section-header">
                <div className="section-header-left">
                  <div className="section-icon-box" style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}>
                    <span className="material-symbols-outlined">connecting_airports</span>
                  </div>
                  <div className="section-title-wrap">
                    <h3 className="section-main-title">Escort Missions &amp; Flight Records</h3>
                    <p className="section-sub-desc">Aviation transit itineraries, airline PNRs, and assigned escorts</p>
                  </div>
                </div>
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  {selectedCustomer.custMissions.length} {selectedCustomer.custMissions.length === 1 ? 'Flight' : 'Flights'}
                </span>
              </div>

              {selectedCustomer.custMissions.map((m: any, idx: number) => (
                <div key={m.id || idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Route</span>
                      <span className="info-val">{m.from_country} &rarr; {m.to_country}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Layover</span>
                      <span className="info-val">{m.layover_country || 'Direct'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Flight &amp; Airline</span>
                      <span className="info-val">{m.airline} {m.flight_no}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">PNR &amp; Date</span>
                      <span className="info-val mono">{m.pnr || 'N/A'} ({m.flight_date || 'N/A'})</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className="info-val"><strong style={{ color: '#0284c7' }}>{m.status}</strong></span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Assigned Escort (Iqama)</span>
                      <span className="info-val mono">{m.escort_employee_iqama || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 7. ATTACHED DOCUMENTS: VAULT FILES, PASSPORTS & MEDIF FORMS */}
          <div id="section-documents" className="modal-section">
            <div className="section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="section-header-left">
                <div className="section-icon-box" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
                  <span className="material-symbols-outlined">folder_shared</span>
                </div>
                <div className="section-title-wrap">
                  <h3 className="section-main-title">Attached Documents &amp; Passports</h3>
                  <p className="section-sub-desc">Verified MEDIF clearance forms and uploaded customer passports</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  href="/forms"
                  target="_blank"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#0284c7',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: '#e0f2fe',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}
                  title="Open airline MEDIF template forms hub"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
                  Airline MEDIF Templates
                </Link>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#0284c7',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: uploadingMedif ? 'wait' : 'pointer',
                    opacity: uploadingMedif ? 0.7 : 1,
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {uploadingMedif ? 'sync' : 'upload_file'}
                  </span>
                  {uploadingMedif ? 'Uploading...' : 'Upload MEDIF Form'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    disabled={uploadingMedif}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onUploadMedif(e.target.files[0], selectedCustomer.id);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Sub-section A: MEDIF Forms */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0284c7' }}>assignment_late</span>
                MEDIF Forms ({selectedCustomer.medifFiles ? selectedCustomer.medifFiles.length : 0})
              </div>

              {selectedCustomer.medifFiles && selectedCustomer.medifFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCustomer.medifFiles.map((file: any, idx: number) => (
                    <div
                      key={file.path || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: '#fef2f2', border: '1px solid #fecaca',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#dc2626', flexShrink: 0
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>picture_as_pdf</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            {file.size ? <span>{(file.size / 1024).toFixed(1)} KB</span> : null}
                            {file.updated_at ? <span>Uploaded on {new Date(file.updated_at).toLocaleDateString()}</span> : null}
                            <span style={{ color: '#0284c7', fontWeight: 600 }}>Airline MEDIF</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          style={{
                            background: '#0284c7', color: '#fff', border: 'none',
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
                            alignItems: 'center', gap: '4px'
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
                            background: '#fff', color: '#334155', border: '1px solid #cbd5e1',
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                            fontWeight: 600, textDecoration: 'none', display: 'inline-flex',
                            alignItems: 'center', gap: '4px'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
                          Download
                        </a>

                        <button
                          type="button"
                          onClick={() => onDeleteMedif(file.path, selectedCustomer.id, file.bucket || 'medical_escort')}
                          style={{
                            background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca',
                            padding: '5px 8px', borderRadius: '6px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
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
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b' }}>
                  No MEDIF form uploaded yet. Use the &quot;Upload MEDIF Form&quot; button above to attach one.
                </div>
              )}
            </div>

            {/* Sub-section B: Customer Passports */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4F5DFF' }}>badge</span>
                Customer Passports ({customerPassports.length})
              </div>

              {loadingPassports ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading passport files...</div>
              ) : customerPassports.length > 0 ? (
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {customerPassports.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => onPreviewFile(file)}
                      style={{
                        width: '130px', height: '160px', background: '#fff', border: '1px solid #cbd5e1',
                        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', display: 'flex',
                        flexDirection: 'column', boxShadow: '0 2px 5px rgba(0,0,0,0.06)', transition: 'transform 0.2s'
                      }}
                    >
                      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {file.type.includes('image') ? (
                          <img src={file.url} alt="Passport preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#ef4444' }}>picture_as_pdf</span>
                        )}
                      </div>
                      <div style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'center', fontWeight: 600, color: '#334155', borderTop: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                  No passport files uploaded in storage for this customer.
                </div>
              )}
            </div>
          </div>

          {/* Floating Back to Top Pill */}
          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className="back-to-top-btn"
              title="Back to top"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
              Top
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>verified</span>
            All details verified &amp; synced from database
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={`/customers/${selectedCustomer.id}`}
              style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span> Edit Customer
            </Link>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#0B1220', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
