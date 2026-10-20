'use client';

import Link from 'next/link';

interface CustomerProfileModalProps {
  viewCustomer: any;
  loadingPassports: boolean;
  viewPassports: any[];
  fileAccessDisabled: boolean;
  services?: any[];
  onClose: () => void;
  onPreviewPassport: (file: any) => void;
}

export default function CustomerProfileModal({
  viewCustomer,
  loadingPassports,
  viewPassports,
  fileAccessDisabled,
  services = [],
  onClose,
  onPreviewPassport
}: CustomerProfileModalProps) {
  if (!viewCustomer) return null;

  const customerServiceNames: string[] = (() => {
    if (Array.isArray(viewCustomer?.services) && viewCustomer.services.length > 0) {
      return viewCustomer.services
        .map((sId: string) => services?.find(s => s.id === sId)?.name)
        .filter(Boolean);
    }
    if (viewCustomer?.service) {
      const match = services?.find(s => s.id === viewCustomer.service)?.name;
      return match ? [match] : [];
    }
    return [];
  })();

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div
        style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        className="hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{viewCustomer.name}</h2>
              {customerServiceNames.map((name, i) => (
                <span key={i} style={{
                  background: name === 'Medical Escort' ? '#e0e7ff' : '#e0f2fe',
                  color: name === 'Medical Escort' ? '#4338ca' : '#0369a1',
                  border: name === 'Medical Escort' ? '1px solid #c7d2fe' : '1px solid #bae6fd',
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600
                }}>
                  {name}
                </span>
              ))}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>Customer Profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px' }}>badge</span>
                Personal Identity
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Service Type(s)</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {customerServiceNames.length > 0 ? (
                      customerServiceNames.map((name, i) => (
                        <span key={i} style={{
                          background: name === 'Medical Escort' ? '#e0e7ff' : '#e0f2fe',
                          color: name === 'Medical Escort' ? '#4338ca' : '#0369a1',
                          padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600
                        }}>
                          {name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date of Birth</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.dob || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nationality</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.nationality || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Passport Number</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.passport_no || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>contact_phone</span>
                Contact Information
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone Number</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.contact_number || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emergency Contact</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.emergency_contact_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emergency Phone</div>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.emergency_contact_phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Physical Address</div>
                  <div style={{ color: '#0f172a', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{viewCustomer.address || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>medical_services</span>
              Medical Information
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Hospital</div>
                <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.current_hospital || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Medical Condition</div>
                <div style={{ color: '#0f172a', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px', minHeight: '60px' }}>
                  {viewCustomer.medical_condition || 'No details provided.'}
                </div>
              </div>
            </div>
          </div>

          {/* Passport Documents Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '20px' }}>passkey</span>
            Passport Documents
          </div>
          
          {loadingPassports ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Loading passports...</div>
          ) : viewPassports.length > 0 ? (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {viewPassports.map((file: any, i: number) => (
                <div 
                  key={i} 
                  className={fileAccessDisabled ? 'access-disabled-btn' : ''}
                  onClick={() => {
                    if (fileAccessDisabled) {
                      alert('File Access Prohibited: You do not have authorization to view this passport document.');
                      return;
                    }
                    onPreviewPassport(file);
                  }}
                  style={{ 
                    width: '120px', 
                    height: '160px', 
                    background: '#fff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '8px', 
                    cursor: fileAccessDisabled ? undefined : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'transform 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ flex: 1, position: 'relative', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {file.type?.includes('image') ? (
                      <img src={file.data || file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="passport" />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ef4444' }}>picture_as_pdf</span>
                    )}
                  </div>
                  <div style={{ padding: '8px', borderTop: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 500, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No passport documents uploaded yet.
            </div>
          )}
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <Link href={`/customers/${viewCustomer.id}`} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit Customer
          </Link>
        </div>
      </div>
    </div>
  );
}
