'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './customers.module.css';
import TableSkeleton from '@/components/TableSkeleton';
import LoadingIcon from '@/components/LoadingIcon';
import { useAuth } from '@/components/AuthGuard';
import { CustomerConfirmModal, CustomerProfileModal } from './components';
import FullscreenFileViewer from '@/components/FullscreenFileViewer';
import { getCachedData, setCachedData } from '@/lib/appDataCache';

export default function CustomersList() {
  const [customers, setCustomers] = useState<any[]>(() => getCachedData('customers') || []);
  const [loading, setLoading] = useState(() => !getCachedData('customers')?.length);
  const [services, setServices] = useState<any[]>(() => getCachedData('services') || []);
  const [search, setSearch] = useState('');
  
  const [deleteMode, setDeleteMode] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [fullscreenFile, setFullscreenFile] = useState<any>(null);
  const { role, username, isFolderAllowed } = useAuth();
  const fileAccessDisabled = role === 'employee' && !isFolderAllowed('customers');

  useEffect(() => {
    if (role === 'admin' || isFolderAllowed('customers')) {
      const hasData = (getCachedData('customers')?.length || 0) > 0;
      fetchCustomers(!hasData);
    }
  }, [role, isFolderAllowed]);

  async function fetchCustomers(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const cachedServices = getCachedData('services');
      const fetchServices = !cachedServices || cachedServices.length === 0;

      const [cRes, sRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
        fetchServices ? supabaseAuth.from('services').select('*') : Promise.resolve({ data: cachedServices })
      ]);
      if (sRes?.data) {
        setServices(sRes.data);
        setCachedData('services', sRes.data);
      }
      if (cRes?.data) {
        setCustomers(cRes.data);
        setCachedData('customers', cRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        const bucketsToClean = new Set<string>();
        const rawCustServices = customer.services || customer.doctor_reports_urls;
        const custServiceIds = Array.isArray(rawCustServices) && rawCustServices.length > 0 
          ? rawCustServices 
          : [customer.service].filter(Boolean);
        
        custServiceIds.forEach((sId: string) => {
          const sObj = services.find((s: any) => s.id === sId);
          if (sObj?.name === 'Medical Escort') bucketsToClean.add('medical_escort');
          if (sObj?.name === 'General Service') bucketsToClean.add('general_service');
        });
        if (bucketsToClean.size === 0) {
          bucketsToClean.add('medical_escort');
          bucketsToClean.add('general_service');
        }

        for (const bucket of Array.from(bucketsToClean)) {
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
    
    const primaryServiceId = customer.service || (Array.isArray(customer.services) && customer.services[0]);
    const serviceObj = services.find(s => s.id === primaryServiceId);
    const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
    
    if (customer.passport && Array.isArray(customer.passport)) {
      const uploadsData = await Promise.all(customer.passport.map(async (file: any) => {
        let signedUrl = null;
        if (bucket) {
          const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(file.path, 3600);
          if (signed?.signedUrl) signedUrl = signed.signedUrl;
        }
        if (!signedUrl) {
          const altBucket = bucket === 'medical_escort' ? 'general_service' : 'medical_escort';
          const { data: altSigned } = await supabaseAuth.storage.from(altBucket).createSignedUrl(file.path, 3600);
          signedUrl = altSigned?.signedUrl;
        }
        return { name: file.name, type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signedUrl, path: file.path };
      }));
      setViewPassports(uploadsData);
    }
    setLoadingPassports(false);
  };

  const getPassports = (customer: any) => {
    return viewPassports;
  };

  if (role === 'employee' && !isFolderAllowed('customers')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>Customer Management</strong> folder. Please contact an administrator.
        </p>
        <Link href="/user/dashboard" style={{ background: '#4F5DFF', color: '#fff', textDecoration: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className={styles.container}>

      <CustomerConfirmModal
        isOpen={showConfirmModal}
        count={deleteIds.length}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
      />

      <Link href="/dashboard" className={styles.backBtn}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
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
                  <td>
                    {(() => {
                      let rawServices = customer.services || customer.doctor_reports_urls;
                      if (typeof rawServices === 'string') {
                        try {
                          const parsed = JSON.parse(rawServices);
                          if (Array.isArray(parsed)) rawServices = parsed;
                        } catch {}
                      }
                      const custServiceNames = Array.isArray(rawServices) && rawServices.length > 0
                        ? rawServices.map((id: string) => services.find(s => s.id === id)?.name).filter(Boolean)
                        : [services.find(s => s.id === customer.service)?.name].filter(Boolean);
                      
                      return custServiceNames.length > 0 ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {custServiceNames.map((name: string, idx: number) => {
                            const isMed = name.toLowerCase().includes('medical');
                            return (
                              <span
                                key={idx}
                                style={{
                                  background: isMed ? '#e0e7ff' : '#e0f2fe',
                                  color: isMed ? '#4338ca' : '#0369a1',
                                  border: isMed ? '1px solid #c7d2fe' : '1px solid #bae6fd',
                                  padding: '2px 8px',
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
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unassigned</span>
                      );
                    })()}
                  </td>
                  
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
    <CustomerProfileModal
      viewCustomer={viewCustomer}
      loadingPassports={loadingPassports}
      viewPassports={viewPassports}
      fileAccessDisabled={fileAccessDisabled}
      services={services}
      onClose={() => setViewCustomer(null)}
      onPreviewPassport={(file) => setFullscreenFile(file)}
    />

    {/* Fullscreen Viewer */}
    <FullscreenFileViewer
      file={fullscreenFile}
      onClose={() => setFullscreenFile(null)}
      onShare={handleShare}
    />
    </>
  );
}







