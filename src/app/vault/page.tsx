'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import LoadingIcon from '@/components/LoadingIcon';

export default function Vault() {
  const { role, isFolderAllowed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Core Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Customer Full Dossier View Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerPassports, setCustomerPassports] = useState<any[]>([]);
  const [loadingPassports, setLoadingPassports] = useState(false);
  const [fullscreenFile, setFullscreenFile] = useState<any | null>(null);

  // Nurse Details Modal
  const [selectedNurse, setSelectedNurse] = useState<any | null>(null);

  // MEDIF Forms State
  const [medifMap, setMedifMap] = useState<Record<string, any[]>>({});
  const [uploadingMedif, setUploadingMedif] = useState(false);

  // Fetch Vault Data
  const fetchAllVaultData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, sRes, invRes, payRes, mRes, empRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('services').select('*'),
        supabaseAuth.from('invoices').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('payment_history').select('*').order('payment_date', { ascending: false }),
        supabaseAuth.from('escort_missions').select('*'),
        supabaseAuth.from('employees').select('id, iqama_number, name, email, phone_number, photo_url, job_title, department, status, last_login')
      ]);

      if (cRes.error) throw cRes.error;
      if (sRes.data) setServices(sRes.data);
      if (invRes.data) setInvoices(invRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (mRes.data) setMissions(mRes.data);
      if (empRes.data) setEmployees(empRes.data);
      if (cRes.data) setCustomers(cRes.data);

      // Fetch MEDIF forms for all customers from storage
      const custList = cRes.data || [];
      const newMedifMap: Record<string, any[]> = {};

      await Promise.all(
        custList.map(async (cust: any) => {
          try {
            let { data: mList } = await supabaseAuth.storage.from('medical_escort').list(`${cust.id}/medif form`);
            let usedBucket = 'medical_escort';

            let validFiles = (mList || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder');
            if (validFiles.length === 0) {
              const { data: gList } = await supabaseAuth.storage.from('general_service').list(`${cust.id}/medif form`);
              const validG = (gList || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder');
              if (validG.length > 0) {
                validFiles = validG;
                usedBucket = 'general_service';
              }
            }

            if (validFiles.length > 0) {
              const filesWithUrl = await Promise.all(
                validFiles.map(async f => {
                  const path = `${cust.id}/medif form/${f.name}`;
                  const { data: signed } = await supabaseAuth.storage.from(usedBucket).createSignedUrl(path, 3600);
                  return {
                    name: f.name,
                    path,
                    bucket: usedBucket,
                    size: f.metadata?.size || 0,
                    updated_at: f.updated_at || f.created_at,
                    url: signed?.signedUrl || '',
                    type: f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
                  };
                })
              );
              newMedifMap[cust.id] = filesWithUrl.filter(f => f.url);
            } else {
              newMedifMap[cust.id] = [];
            }
          } catch {
            newMedifMap[cust.id] = [];
          }
        })
      );

      setMedifMap(newMedifMap);
    } catch (err: any) {
      console.error('Vault data fetch error:', err);
      setError(err.message || 'Failed to load vault records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVaultData();
  }, []);

  // Process Customers with Invoices, Payments, Missions, and Assigned Nurse
  const processedCustomers = useMemo(() => {
    return customers.map(cust => {
      const serviceObj = services.find(s => s.id === cust.service);
      const serviceName = serviceObj?.name || 'Unassigned';

      // Customer Invoices
      const custInvoices = invoices.filter(inv => inv.customer_id === cust.id);
      const invoiceIds = custInvoices.map(i => i.id);

      // Payments for this customer's invoices
      const custPayments = payments.filter(p => invoiceIds.includes(p.invoice_id));

      // Financial calculations
      const totalAmount = custInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
      const totalAdvance = custInvoices.reduce((sum, inv) => sum + (Number(inv.advance_payment) || 0), 0);
      const totalBalance = custInvoices.reduce((sum, inv) => sum + (Number(inv.balance_amount) || 0), 0);

      // Overall Payment Status
      let paymentStatus = 'No Invoice';
      if (custInvoices.length > 0) {
        const hasUnpaid = custInvoices.some(i => i.status === 'Unpaid');
        const hasPartial = custInvoices.some(i => i.status === 'Partially Paid');
        const allPaid = custInvoices.every(i => i.status === 'Paid');

        if (allPaid || totalBalance <= 0) {
          paymentStatus = 'Paid';
        } else if (hasPartial || (totalAdvance > 0 && totalBalance > 0)) {
          paymentStatus = 'Partially Paid';
        } else if (hasUnpaid) {
          paymentStatus = 'Unpaid';
        } else {
          paymentStatus = custInvoices[0]?.status || 'Unpaid';
        }
      }

      // Customer Escort Mission(s)
      const custMissions = missions.filter(m => m.customer_id === cust.id);

      // Assigned Nurse Lookup (from mission or customer record)
      const assignedMission = custMissions.find(m => m.escort_employee_iqama);
      const nurseIqama = cust.assigned_nurse_iqama || cust.nurse_iqama || assignedMission?.escort_employee_iqama || null;

      let nurse: any = null;
      if (nurseIqama) {
        nurse = employees.find(e => e.iqama_number === nurseIqama || e.id === nurseIqama);
        if (!nurse) {
          nurse = {
            name: assignedMission?.employee_name || 'Assigned Nurse',
            iqama_number: nurseIqama,
            job_title: 'Flight Nurse / Medical Escort',
            department: 'Clinical Operations / Nursing',
            status: 'active'
          };
        }
      }

      const custMedifFiles = medifMap[cust.id] || [];

      return {
        ...cust,
        serviceName,
        custInvoices,
        custPayments,
        totalAmount,
        totalAdvance,
        totalBalance,
        paymentStatus,
        custMissions,
        nurse,
        nurseIqama,
        medifFiles: custMedifFiles
      };
    });
  }, [customers, services, invoices, payments, missions, employees, medifMap]);

  // Filtered Customer List
  const filteredCustomers = useMemo(() => {
    return processedCustomers.filter(c => {
      // Search
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.iqama_number && c.iqama_number.toLowerCase().includes(q)) ||
        (c.passport_no && c.passport_no.toLowerCase().includes(q)) ||
        (c.nationality && c.nationality.toLowerCase().includes(q)) ||
        (c.contact_number && c.contact_number.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.serviceName && c.serviceName.toLowerCase().includes(q)) ||
        (c.nurse?.name && c.nurse.name.toLowerCase().includes(q)) ||
        (c.nurse?.iqama_number && c.nurse.iqama_number.toLowerCase().includes(q)) ||
        (c.medifFiles && c.medifFiles.some((f: any) => f.name.toLowerCase().includes(q)));

      // Service filter
      const matchService = serviceFilter === 'all' ||
        (serviceFilter === 'escort' && c.serviceName === 'Medical Escort') ||
        (serviceFilter === 'general' && c.serviceName !== 'Medical Escort');

      // Payment filter
      const matchPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter;

      return matchSearch && matchService && matchPayment;
    });
  }, [processedCustomers, search, serviceFilter, paymentFilter]);

  // Open Full Customer Dossier
  const handleOpenCustomer = async (cust: any) => {
    const mFiles = medifMap[cust.id] || cust.medifFiles || [];
    setSelectedCustomer({ ...cust, medifFiles: mFiles });
    setLoadingPassports(true);
    setCustomerPassports([]);

    try {
      const bucket = cust.serviceName === 'Medical Escort' ? 'medical_escort' : 'general_service';
      if (bucket && cust.passport && Array.isArray(cust.passport) && cust.passport.length > 0) {
        const filesData = await Promise.all(
          cust.passport.map(async (file: any) => {
            const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(file.path, 3600);
            return {
              name: file.name || 'Passport Document',
              type: (file.name || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
              url: signed?.signedUrl || '',
              path: file.path
            };
          })
        );
        setCustomerPassports(filesData.filter(f => f.url));
      }
    } catch (err) {
      console.error('Error fetching passport storage files:', err);
    } finally {
      setLoadingPassports(false);
    }
  };

  // Upload MEDIF Form for a Customer
  const handleUploadMedif = async (file: File, customerId: string) => {
    if (!file || !customerId) return;
    setUploadingMedif(true);
    try {
      const filePath = `${customerId}/medif form/${file.name}`;
      const { error: upErr } = await supabaseAuth.storage.from('medical_escort').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: signed } = await supabaseAuth.storage.from('medical_escort').createSignedUrl(filePath, 3600);
      const newEntry = {
        name: file.name,
        path: filePath,
        bucket: 'medical_escort',
        size: file.size,
        updated_at: new Date().toISOString(),
        url: signed?.signedUrl || '',
        type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      };

      setMedifMap(prev => {
        const existing = prev[customerId] || [];
        return {
          ...prev,
          [customerId]: [...existing.filter(f => f.name !== file.name), newEntry]
        };
      });

      setSelectedCustomer((prev: any) => {
        if (!prev || prev.id !== customerId) return prev;
        const currentList = prev.medifFiles || [];
        return {
          ...prev,
          medifFiles: [...currentList.filter((f: any) => f.name !== file.name), newEntry]
        };
      });
    } catch (err: any) {
      console.error('MEDIF upload error:', err);
      alert('Failed to upload MEDIF form: ' + err.message);
    } finally {
      setUploadingMedif(false);
    }
  };

  // Delete MEDIF Form for a Customer
  const handleDeleteMedif = async (filePath: string, customerId: string, bucket = 'medical_escort') => {
    if (!confirm('Are you sure you want to remove this MEDIF form?')) return;
    try {
      const { error: delErr } = await supabaseAuth.storage.from(bucket).remove([filePath]);
      if (delErr) throw delErr;

      setMedifMap(prev => ({
        ...prev,
        [customerId]: (prev[customerId] || []).filter(f => f.path !== filePath)
      }));

      setSelectedCustomer((prev: any) => {
        if (!prev || prev.id !== customerId) return prev;
        return {
          ...prev,
          medifFiles: (prev.medifFiles || []).filter((f: any) => f.path !== filePath)
        };
      });
    } catch (err: any) {
      console.error('Delete MEDIF error:', err);
      alert('Failed to delete MEDIF form: ' + err.message);
    }
  };

  // Employee Protection
  if (role === 'employee' && !isFolderAllowed('vault')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>Document Vault</strong>. Please contact an administrator.
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
      <style dangerouslySetInnerHTML={{__html: `
        .vault-page { max-width: 1300px; margin: 0 auto; padding: 32px 24px; font-family: 'Inter', -apple-system, sans-serif; color: #0f172a; }
        .vault-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: #4F5DFF; background: #EEF1FF; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .back-link:hover { background: #e0e7ff; }

        /* Search & Filters */
        .filter-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; justify-content: space-between; }
        .search-box { position: relative; flex: 1; min-width: 280px; max-width: 480px; }
        .search-box input { width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .search-box input:focus { border-color: #4F5DFF; box-shadow: 0 0 0 3px rgba(79, 93, 255, 0.15); }
        .search-box .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 20px; pointer-events: none; }
        .select-filter { padding: 9px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; font-size: 13px; font-weight: 500; color: #334155; outline: none; cursor: pointer; }

        /* Table */
        .table-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .vault-table { width: 100%; min-width: 1050px; border-collapse: collapse; text-align: left; }
        .vault-table th { background: #f8fafc; padding: 14px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .vault-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .vault-table tr:hover { background: #fafbff; }
        .vault-table tr:last-child td { border-bottom: none; }

        /* Badges */
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-partial { background: #fef3c7; color: #b45309; }
        .badge-unpaid { background: #fee2e2; color: #b91c1c; }
        .badge-noinv { background: #f1f5f9; color: #64748b; }
        .badge-service { background: #EEF2FF; color: #4338CA; font-weight: 600; text-transform: none; }

        /* Nurse Chip Clickable */
        .nurse-chip { transition: all 0.2s; cursor: pointer; user-select: none; }
        .nurse-chip:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(16, 185, 129, 0.25); background: #d1fae5 !important; }

        /* MEDIF Badge Button */
        .medif-badge-btn { transition: all 0.2s; cursor: pointer; user-select: none; }
        .medif-badge-btn:hover { background: #fee2e2 !important; border-color: #fca5a5 !important; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(220, 38, 38, 0.15); }

        /* Action View Button */
        .view-action-btn { background: #4F5DFF; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(79, 93, 255, 0.25); transition: all 0.2s; white-space: nowrap; }
        .view-action-btn:hover { background: #3b49e0; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(79, 93, 255, 0.35); }

        /* Modal Backdrop & Container */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(5px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-card { background: #ffffff; border-radius: 20px; width: 100%; max-width: 950px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: zoomIn 0.2s ease-out; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        
        .modal-header { padding: 20px 28px; background: linear-gradient(135deg, #0B1220 0%, #1E293B 100%); color: #ffffff; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .modal-body { padding: 28px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 24px; background: #f8fafc; }
        .modal-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .section-title { font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; margin: 0 0 16px 0; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
        .info-item { display: flex; flex-direction: column; gap: 2px; }
        .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .info-val { font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-word; }

        /* Media queries */
        @media (max-width: 768px) {
          .vault-page { padding: 20px 12px; }
          .modal-card { max-height: 95vh; }
          .modal-header { padding: 16px 20px; }
          .modal-body { padding: 18px 14px; }
          .info-grid { grid-template-columns: 1fr; }
        }
      `}} />

      <main className="vault-page">
        {/* Top Header */}
        <div className="vault-top">
          <div>
            <Link href="/dashboard" className="back-link">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> Back to Dashboard
            </Link>
            <h1 style={{ margin: '14px 0 4px 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              Document Vault
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Centralized customer dossiers, payment records, travel credentials, MEDIF forms, and vaulted documents.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search by Customer Name, Iqama, Passport No, MEDIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="select-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">All Services</option>
              <option value="escort">Medical Escort</option>
              <option value="general">General Service</option>
            </select>

            <select
              className="select-filter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="No Invoice">No Invoice</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '14px 18px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', marginBottom: '16px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Customers Vault Table */}
        <div className="table-card">
          <div className="table-container">
            <table className="vault-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Name</th>
                  <th style={{ width: '15%' }}>Iqama</th>
                  <th style={{ width: '15%' }}>Passport No</th>
                  <th style={{ width: '14%' }}>Service</th>
                  <th style={{ width: '20%' }}>Payment Info</th>
                  <th style={{ width: '14%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px' }}>
                      <LoadingIcon />
                    </td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => {
                    let payBadgeClass = 'badge-noinv';
                    if (customer.paymentStatus === 'Paid') payBadgeClass = 'badge-paid';
                    else if (customer.paymentStatus === 'Partially Paid') payBadgeClass = 'badge-partial';
                    else if (customer.paymentStatus === 'Unpaid') payBadgeClass = 'badge-unpaid';

                    return (
                      <tr key={customer.id}>
                        {/* 1. Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #4F5DFF 0%, #6366F1 100%)',
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '14px', flexShrink: 0
                            }}>
                              {(customer.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.name || 'Unnamed'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{customer.nationality || 'Nationality Unspecified'}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Iqama */}
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>
                            {customer.iqama_number || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Not Provided</span>}
                          </span>
                        </td>

                        {/* 3. Passport No */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>badge</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
                              {customer.passport_no || <span style={{ color: '#94a3b8', fontWeight: 400 }}>N/A</span>}
                            </span>
                          </div>
                        </td>

                        {/* 4. Service */}
                        <td>
                          <span className="badge badge-service">
                            {customer.serviceName}
                          </span>
                        </td>

                        {/* 5. Payment Info */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={`badge ${payBadgeClass}`}>
                                {customer.paymentStatus}
                              </span>
                            </div>
                            {customer.totalAmount > 0 && (
                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                <strong>${customer.totalAmount.toLocaleString()}</strong>
                                {customer.totalBalance > 0 ? (
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>(Bal: ${customer.totalBalance.toLocaleString()})</span>
                                ) : (
                                  <span style={{ color: '#16a34a', marginLeft: '4px' }}>(Settled)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 6. Action: View Details */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="view-action-btn"
                            onClick={() => handleOpenCustomer(customer)}
                            title="View Complete Customer Dossier"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '8px' }}>search_off</span>
                      <h3 style={{ margin: '4px 0', fontSize: '16px', color: '#334155' }}>No customers found in vault</h3>
                      <p style={{ margin: 0, fontSize: '13px' }}>Try searching with a different name, passport number, or filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* COMPREHENSIVE VIEW CUSTOMER DOSSIER MODAL ("ALL MEANS ALL") */}
      {/* ======================================================== */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F5DFF 0%, #6366F1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(79, 93, 255, 0.4)'
                }}>
                  {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{selectedCustomer.name}</h2>
                    <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                      {selectedCustomer.serviceName}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Customer ID: {selectedCustomer.id} &middot; Created on {new Date(selectedCustomer.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">

              {/* 1. FINANCIAL & PAYMENT INFO */}
              <div className="modal-section" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#10b981' }}>payments</span>
                  Payment &amp; Invoicing Details
                </div>

                <div className="info-grid" style={{ marginBottom: '16px' }}>
                  <div className="info-item">
                    <span className="info-label">Payment Status</span>
                    <span className="info-val">
                      <span className={`badge ${selectedCustomer.paymentStatus === 'Paid' ? 'badge-paid' : selectedCustomer.paymentStatus === 'Partially Paid' ? 'badge-partial' : selectedCustomer.paymentStatus === 'Unpaid' ? 'badge-unpaid' : 'badge-noinv'}`}>
                        {selectedCustomer.paymentStatus}
                      </span>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total Invoiced</span>
                    <span className="info-val" style={{ color: '#0f172a', fontSize: '16px' }}>
                      ${selectedCustomer.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Advance / Paid Amount</span>
                    <span className="info-val" style={{ color: '#10b981', fontSize: '16px' }}>
                      ${selectedCustomer.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Remaining Balance</span>
                    <span className="info-val" style={{ color: selectedCustomer.totalBalance > 0 ? '#ef4444' : '#10b981', fontSize: '16px' }}>
                      ${selectedCustomer.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Invoices List */}
                {selectedCustomer.custInvoices && selectedCustomer.custInvoices.length > 0 ? (
                  <div style={{ marginTop: '14px', background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Invoices Generated ({selectedCustomer.custInvoices.length}):
                    </div>
                    {selectedCustomer.custInvoices.map((inv: any, idx: number) => (
                      <div key={inv.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx !== selectedCustomer.custInvoices.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: '13px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong>Invoice #{inv.id.substring(0, 8)}</strong> &middot;{' '}
                          <span style={{ color: '#64748b' }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Subtotal: ${inv.subtotal} | Tax/VAT: {inv.tax_vat_percent}% | Disc: ${inv.discount}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>Total: ${inv.total_amount}</span>{' '}
                          <span style={{ color: '#64748b' }}>(Bal: ${inv.balance_amount})</span>
                          <Link href={`/invoices/${inv.id}`} style={{ marginLeft: '10px', color: '#4F5DFF', textDecoration: 'none', fontWeight: 600 }}>
                            View Bill &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                    No invoice generated yet for this customer.
                  </div>
                )}

                {/* Logged Payment Transactions */}
                {selectedCustomer.custPayments && selectedCustomer.custPayments.length > 0 && (
                  <div style={{ marginTop: '14px', background: '#ecfdf5', borderRadius: '10px', padding: '14px', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
                      Payment Receipts / History ({selectedCustomer.custPayments.length}):
                    </div>
                    {selectedCustomer.custPayments.map((p: any, idx: number) => (
                      <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', color: '#065f46' }}>
                        <span>
                          <strong>${p.amount}</strong> &middot; {p.payment_method || 'Direct'} &middot; {p.remarks || 'Receipt logged'}
                        </span>
                        <span>{new Date(p.payment_date || Date.now()).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. PRIMARY IDENTITY & CONTACT ("NAME, IQAMA, PASSPORT NO FIRST") */}
              <div className="modal-section" style={{ borderLeft: '4px solid #4F5DFF' }}>
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#4F5DFF' }}>badge</span>
                  Personal &amp; Identity Information
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-val">{selectedCustomer.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Iqama Number</span>
                    <span className="info-val" style={{ fontFamily: 'monospace' }}>
                      {selectedCustomer.iqama_number || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Passport Number</span>
                    <span className="info-val">{selectedCustomer.passport_no || 'N/A'}</span>
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

              {/* 4. VISA & IMMIGRATION DETAILS */}
              <div className="modal-section">
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#8b5cf6' }}>flight</span>
                  Visa &amp; Travel Documentation
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Visa Number</span>
                    <span className="info-val">{selectedCustomer.visa_no || 'N/A'}</span>
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

              {/* 5. EMERGENCY CONTACTS */}
              <div className="modal-section">
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>emergency</span>
                  Emergency Contacts
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

              {/* 6. MEDICAL INFORMATION */}
              <div className="modal-section">
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>medical_services</span>
                  Medical &amp; Clinical Information
                </div>

                <div className="info-grid">
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-label">Current Hospital</span>
                    <span className="info-val">{selectedCustomer.current_hospital || 'Not Specified'}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="info-label">Medical Condition / Diagnosis</span>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                      {selectedCustomer.medical_condition || 'No clinical condition specified.'}
                    </div>
                  </div>
                  {selectedCustomer.fitness_to_fly_url && (
                    <div className="info-item" style={{ gridColumn: 'span 2' }}>
                      <span className="info-label">Fitness To Fly Document</span>
                      <a href={selectedCustomer.fitness_to_fly_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px', textDecoration: 'underline' }}>
                        Open Fitness to Fly Document &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. ESCORT MISSIONS & OPERATIONAL SERVICE DATA */}
              {selectedCustomer.custMissions && selectedCustomer.custMissions.length > 0 && (
                <div className="modal-section">
                  <div className="section-title">
                    <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>connecting_airports</span>
                    Escort Missions &amp; Flight Records ({selectedCustomer.custMissions.length})
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
                          <span className="info-val">{m.pnr || 'N/A'} ({m.flight_date || 'N/A'})</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Status</span>
                          <span className="info-val"><strong style={{ color: '#0284c7' }}>{m.status}</strong></span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Assigned Escort (Iqama)</span>
                          <span className="info-val">{m.escort_employee_iqama || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7. ATTACHED DOCUMENTS: VAULT FILES, PASSPORTS & MEDIF FORMS */}
              <div className="modal-section" style={{ borderLeft: '4px solid #4F5DFF' }}>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#4F5DFF' }}>folder_shared</span>
                    Vault Files &amp; Passports
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
                        padding: '5px 10px',
                        borderRadius: '6px'
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
                        padding: '5px 12px',
                        borderRadius: '6px',
                        cursor: uploadingMedif ? 'wait' : 'pointer',
                        opacity: uploadingMedif ? 0.7 : 1
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
                            handleUploadMedif(e.target.files[0], selectedCustomer.id);
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
                              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
                                {file.size ? <span>{(file.size / 1024).toFixed(1)} KB</span> : null}
                                {file.updated_at ? <span>Uploaded on {new Date(file.updated_at).toLocaleDateString()}</span> : null}
                                <span style={{ color: '#0284c7', fontWeight: 600 }}>Airline MEDIF</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setFullscreenFile(file)}
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
                              onClick={() => handleDeleteMedif(file.path, selectedCustomer.id, file.bucket || 'medical_escort')}
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
                          onClick={() => setFullscreenFile(file)}
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

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
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
                  onClick={() => setSelectedCustomer(null)}
                  style={{ background: '#0B1220', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NURSE DETAILS MODAL (POPUP ON CLICKING NURSE NAME/IQAMA) */}
      {/* ======================================================== */}
      {selectedNurse && (
        <div className="modal-overlay" onClick={() => setSelectedNurse(null)}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
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
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => setSelectedNurse(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  width: '32px', height: '32px', borderRadius: '50%',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
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
            <div style={{ padding: '24px 28px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            <div style={{ padding: '16px 28px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedNurse(null)}
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
      )}

      {/* Fullscreen File Viewer */}
      {fullscreenFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0, color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{fullscreenFile.name}</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href={fullscreenFile.url} download={fullscreenFile.name} target="_blank" rel="noreferrer" style={{ background: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> Download
              </a>
              <button onClick={() => setFullscreenFile(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>
                &times;
              </button>
            </div>
          </div>

          <div style={{ width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '40px' }}>
            {fullscreenFile.type.includes('image') ? (
              <img src={fullscreenFile.url} alt="Fullscreen preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <iframe src={fullscreenFile.url} style={{ width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: '8px' }} title="PDF Preview" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
