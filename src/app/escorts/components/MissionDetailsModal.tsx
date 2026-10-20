'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface MissionDetailsModalProps {
  viewMission: any;
  onClose: () => void;
}

export default function MissionDetailsModal({
  viewMission,
  onClose
}: MissionDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!viewMission) return null;

  let rList: string[] = [];
  if (viewMission.reasons) {
    try {
      const parsed = JSON.parse(viewMission.reasons);
      if (Array.isArray(parsed)) rList = parsed;
      else rList = [viewMission.reasons];
    } catch {
      rList = [viewMission.reasons];
    }
  }

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
                background: '#e0e7ff',
                color: '#4f46e5',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined">flight_takeoff</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Mission Details</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                Status: <span style={{ fontWeight: 600, color: '#2563eb' }}>{viewMission.status}</span>
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: People */}
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
              Assignment Info
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Customer Name</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                  {viewMission.customers?.name || 'Unknown'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Assigned Escort</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                  {viewMission.employee_name || viewMission.escort_employee_iqama || 'Unassigned'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Current Hospital</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                  {viewMission.customers?.current_hospital || '-'}
                </div>
              </div>

              {rList.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Reasons / Notes</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {rList.map((r: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: '#fef08a',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          color: '#854d0e',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMission.passport_files && viewMission.passport_files.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Passport Preview</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {viewMission.passport_files.map((file: any, idx: number) => (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                        {file.name?.toLowerCase().endsWith('.pdf') ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#2563eb', padding: '10px' }}
                          >
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                            <span>{file.name}</span>
                          </a>
                        ) : (
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <img src={file.url} alt="Passport" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMission.medif_files && viewMission.medif_files.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>MEDIF Form Preview</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {viewMission.medif_files.map((file: any, idx: number) => (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                        {file.name?.toLowerCase().endsWith('.pdf') ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#16a34a', padding: '10px' }}
                          >
                            <span className="material-symbols-outlined">description</span>
                            <span>{file.name}</span>
                          </a>
                        ) : (
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <img src={file.url} alt="MEDIF" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Logistics */}
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
              Travel Logistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Route</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>
                  {viewMission.from_country} {viewMission.layover_country ? '→ ' + viewMission.layover_country + ' ' : ''}→ {viewMission.to_country}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Required Date</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.escort_required_date || '-'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Boarding / Pick-up</div>
                <div style={{ color: '#0f172a' }}>{viewMission.boarding_details || '-'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Destination / Hospital</div>
                <div style={{ color: '#0f172a' }}>{viewMission.destination_address || '-'}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Flight Info */}
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
              Flight Details &amp; Costs
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Airline</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.airline || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Flight No.</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.flight_no || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Flight Date</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.flight_date || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PNR</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.pnr || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ticket Cost</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>${viewMission.ticket_cost || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Approx Total Cost</div>
                <div style={{ color: '#16a34a', fontWeight: 600 }}>${viewMission.approx_cost || 0}</div>
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
            boxShadow: '0 -10px 15px -3px rgba(0,0,0,0.05)',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <Link
            href={`/escorts/${viewMission.id}`}
            style={{
              padding: '10px 20px',
              background: '#e2e8f0',
              color: '#0f172a',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Edit Mission
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
