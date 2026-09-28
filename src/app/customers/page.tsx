'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './customers.module.css';
import TableSkeleton from '@/components/TableSkeleton';
import LoadingIcon from '@/components/LoadingIcon';

export default function CustomersList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [deleteMode, setDeleteMode] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [fullscreenFile, setFullscreenFile] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
      supabaseAuth.from('services').select('*')
    ]);
    if (sRes.data) setServices(sRes.data);
    if (cRes.data) setCustomers(cRes.data);
    setLoading(false);
  }

  const filteredCustomers = customers.filter(p => 
    (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.passport_no && p.passport_no.toLowerCase().includes(search.toLowerCase())) ||
    (p.nationality && p.nationality.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setDeleteIds(selectedIds);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    setDeleting(true);

    for (const id of deleteIds) {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        const serviceObj = services.find((s: any) => s.id === customer.service);
        const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
        if (bucket) {
           const deleteRecursively = async (path: string) => {
             const { data: list } = await supabaseAuth.storage.from(bucket).list(path);
             if (!list || list.length === 0) return;
             
             for (const item of list) {
               if (item.id === null) {
                 await deleteRecursively(path + '/' + item.name);
               } else {
                 await supabaseAuth.storage.from(bucket).remove([path + '/' + item.name]);
               }
             }
           };
           await deleteRecursively(id);
        }
      }
    }

    const { error } = await supabaseAuth.from('customers').delete().in('id', deleteIds);
    setDeleting(false);
    
    if (error) {
      alert('Error deleting customers: ' + error.message);
    } else {
      setSelectedIds([]);
      setDeleteMode(false);
      fetchCustomers();
    }
  };

  const handleShare = async (file: any) => {
    try {
      const res = await fetch(file.data);
      const blob = await res.blob();
      const fileObj = new File([blob], file.name, { type: file.type });

      if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: file.name,
          text: 'Customer Passport Document'
        });
      } else {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
      }
    } catch (err) {
      console.error(err);
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      link.click();
    }
  };

  // Helper to safely parse passport photos from stringified JSON
  const [viewPassports, setViewPassports] = useState<any[]>([]);
  const [loadingPassports, setLoadingPassports] = useState(false);

  const handleViewCustomer = async (customer: any) => {
    setViewCustomer(customer);
    setLoadingPassports(true);
    setViewPassports([]);
    
    const serviceObj = services.find(s => s.id === customer.service);
    const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
    
    if (bucket && customer.passport && Array.isArray(customer.passport)) {
      const uploadsData = await Promise.all(customer.passport.map(async (file: any) => {
        const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(file.path, 3600);
        return { name: file.name, type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signed?.signedUrl, path: file.path };
      }));
      setViewPassports(uploadsData);
    }
    setLoadingPassports(false);
  };

  const getPassports = (customer: any) => {
    return viewPassports;
  };

  return (
    <>
    <div className={styles.container}>

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Confirm Deletion</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to delete {deleteIds.length} customer(s)?<br/><br/>
              <b>Warning:</b> Deleting customer details will permanently delete all the files (passports, tickets) related to it! This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/dashboard" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Management</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          {deleteMode && selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={deleting}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined">delete_forever</span> 
              {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          )}
          <button 
            onClick={() => { setDeleteMode(!deleteMode); setSelectedIds([]); }} 
            style={{ background: deleteMode ? '#f1f5f9' : '#fee2e2', color: deleteMode ? '#475569' : '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined">{deleteMode ? 'close' : 'delete'}</span> 
            {deleteMode ? 'Cancel' : 'Delete'}
          </button>
          <Link href="/customers/new" className={styles.addBtn}>
            <span className="material-symbols-outlined">person_add</span> Add New Customer
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search by name, passport, or country..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}><table className={styles.table}>
          <thead>
            <tr>
              {deleteMode && <th style={{ width: '40px', textAlign: 'center' }}></th>}
              <th>Customer Name</th>
              <th>Service</th>
              <th>Nationality</th>
              <th>Passport No</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={deleteMode ? 7 : 6} />
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} style={{ background: selectedIds.includes(customer.id) ? '#fef2f2' : 'transparent', transition: 'background 0.2s' }}>
                  {deleteMode && (
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(customer.id)} 
                        onChange={() => toggleSelect(customer.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ef4444' }}
                      />
                    </td>
                  )}
                  <td style={{ fontWeight: 500 }}>{customer.name}</td>
                  <td>{services.find(s => s.id === customer.service)?.name || 'Unassigned'}</td>
                  
                  <td>{customer.nationality || 'N/A'}</td>
                  <td>{customer.passport_no || 'N/A'}</td>
                  <td>{customer.contact_number || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleViewCustomer(customer)}
                        style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 500 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span> View
                      </button>
                      <Link href={`/customers/${customer.id}`} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>

    {/* View Customer Modal */}
    {viewCustomer && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} className="hide-scrollbar">
          
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{viewCustomer.name}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>Customer Profile</p>
            </div>
            <button onClick={() => setViewCustomer(null)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
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
                {getPassports(viewCustomer).map((file: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => setFullscreenFile(file)}
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
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ flex: 1, position: 'relative', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {file.type.includes('image') ? (
                        <img src={file.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="passport" />
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
    )}

    {/* Fullscreen Viewer */}
    {fullscreenFile && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0 }}>
          <h3 style={{ color: 'white', margin: 0 }}>{fullscreenFile.name}</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => handleShare(fullscreenFile)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span className="material-symbols-outlined">share</span> Share / Download
            </button>
            <button onClick={() => setFullscreenFile(null)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
          </div>
        </div>
        
        <div style={{ width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '40px' }}>
          {fullscreenFile.type.includes('image') ? (
            <img src={fullscreenFile.data} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Fullscreen Preview" />
          ) : (
            <iframe src={fullscreenFile.data} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '8px' }} title="Fullscreen PDF" />
          )}
        </div>
      </div>
    )}
    </>
  );
}







