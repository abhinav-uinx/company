'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import TableSkeleton from '@/components/common/TableSkeleton';
import { CustomerDossierModal, NurseDetailsModal, FullscreenFileViewer } from './components';

// Module-level in-memory cache for instant navigation without loading spinner
let vaultMemoryCache: {
  customers: any[];
  services: any[];
  invoices: any[];
  payments: any[];
  missions: any[];
  employees: any[];
  medifMap: Record<string, any[]>;
  timestamp: number;
} | null = null;

export default function Vault() {
  const { role, isFolderAllowed } = useAuth();

  // Instant cache detection: if cache exists, loading starts as false
  const hasCache = Boolean(vaultMemoryCache && vaultMemoryCache.customers.length > 0);

  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState('');

  // Core Data initialized synchronously from memory cache if available
  const [customers, setCustomers] = useState<any[]>(vaultMemoryCache?.customers || []);
  const [services, setServices] = useState<any[]>(vaultMemoryCache?.services || []);
  const [invoices, setInvoices] = useState<any[]>(vaultMemoryCache?.invoices || []);
  const [payments, setPayments] = useState<any[]>(vaultMemoryCache?.payments || []);
  const [missions, setMissions] = useState<any[]>(vaultMemoryCache?.missions || []);
  const [employees, setEmployees] = useState<any[]>(vaultMemoryCache?.employees || []);

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

  // MEDIF Forms State (cached in-memory across navigations)
  const [medifMap, setMedifMap] = useState<Record<string, any[]>>(vaultMemoryCache?.medifMap || {});
  const [uploadingMedif, setUploadingMedif] = useState(false);

  // On-demand MEDIF loader for a single customer (fast, never blocks the table)
  const fetchCustomerMedif = async (customerId: string, hasMedical: boolean): Promise<any[]> => {
    if (medifMap[customerId] && medifMap[customerId].length > 0) {
      return medifMap[customerId];
    }
    try {
      const primaryBucket = hasMedical ? 'medical_escort' : 'general_service';
      const altBucket = hasMedical ? 'general_service' : 'medical_escort';

      let { data: mList } = await supabaseAuth.storage.from(primaryBucket).list(`${customerId}/medif form`);
      let usedBucket = primaryBucket;
      let validFiles = (mList || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder');

      if (validFiles.length === 0) {
        const { data: gList } = await supabaseAuth.storage.from(altBucket).list(`${customerId}/medif form`);
        const validG = (gList || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder');
        if (validG.length > 0) {
          validFiles = validG;
          usedBucket = altBucket;
        }
      }

      if (validFiles.length > 0) {
        const filesWithUrl = await Promise.all(
          validFiles.map(async f => {
            const path = `${customerId}/medif form/${f.name}`;
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
        const resolved = filesWithUrl.filter(f => f.url);
        setMedifMap(prev => {
          const updated = { ...prev, [customerId]: resolved };
          if (vaultMemoryCache) vaultMemoryCache.medifMap = updated;
          return updated;
        });
        return resolved;
      }
    } catch (e) {
      console.warn('On-demand MEDIF fetch error:', e);
    }
    return [];
  };

  // High-performance Vault Data Fetcher: only fetches DB tables in parallel (~150-250ms)
  const fetchAllVaultData = async (isBackgroundRevalidate = false) => {
    if (!isBackgroundRevalidate && !vaultMemoryCache) {
      setLoading(true);
    }
    setError('');

    try {
      const [cRes, sRes, invRes, payRes, mRes, empRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('services').select('*'),
        supabaseAuth.from('invoices').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('payment_history').select('*').order('payment_date', { ascending: false }),
        supabaseAuth.from('escort_missions').select('*'),
        supabaseAuth.from('employees').select('id,iqama_number,name,email,phone_number,photo_url,job_title,department,status,last_login')
      ]);

      if (cRes.error) throw cRes.error;

      const cData = cRes.data || [];
      const sData = sRes.data || [];
      const invData = invRes.data || [];
      const payData = payRes.data || [];
      const mData = mRes.data || [];
      const empData = empRes.data || [];

      setCustomers(cData);
      setServices(sData);
      setInvoices(invData);
      setPayments(payData);
      setMissions(mData);
      setEmployees(empData);

      // Immediately dismiss loading state - table is ready!
      setLoading(false);

      // Save to memory cache for zero-loading navigation
      vaultMemoryCache = {
        customers: cData,
        services: sData,
        invoices: invData,
        payments: payData,
        missions: mData,
        employees: empData,
        medifMap: vaultMemoryCache?.medifMap || {},
        timestamp: Date.now()
      };

      // Persist in sessionStorage for instant browser session reloads
      try {
        sessionStorage.setItem('medescort_vault_cache', JSON.stringify({
          customers: cData,
          services: sData,
          invoices: invData,
          payments: payData,
          missions: mData,
          employees: empData,
          timestamp: Date.now()
        }));
      } catch {}
    } catch (err: any) {
      console.error('Vault data fetch error:', err);
      setError(err.message || 'Failed to load vault records');
      setLoading(false);
    }
  };

  useEffect(() => {
    let cachePresent = Boolean(vaultMemoryCache && vaultMemoryCache.customers.length > 0);
    // If not in memory, check sessionStorage for instant zero-wait load
    if (!vaultMemoryCache && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('medescort_vault_cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.customers) && parsed.customers.length > 0) {
            setCustomers(parsed.customers);
            if (parsed.services) setServices(parsed.services);
            if (parsed.invoices) setInvoices(parsed.invoices);
            if (parsed.payments) setPayments(parsed.payments);
            if (parsed.missions) setMissions(parsed.missions);
            if (parsed.employees) setEmployees(parsed.employees);
            setLoading(false);
            cachePresent = true;
          }
        }
      } catch {}
    }

    // Fetch fresh data (silently in background if cache is already present)
    fetchAllVaultData(cachePresent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal accessibility: background scroll lock and Escape key dismiss
  useEffect(() => {
    if (selectedCustomer || selectedNurse || fullscreenFile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenFile) setFullscreenFile(null);
        else if (selectedNurse) setSelectedNurse(null);
        else if (selectedCustomer) setSelectedCustomer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCustomer, selectedNurse, fullscreenFile]);



  // Process Customers with Invoices, Payments, Missions, and Assigned Nurse
  const processedCustomers = useMemo(() => {
    return customers.map(cust => {
      let rawServices = cust.services || cust.doctor_reports_urls;
      if (typeof rawServices === 'string') {
        try {
          const parsed = JSON.parse(rawServices);
          if (Array.isArray(parsed)) rawServices = parsed;
        } catch {}
      }

      const custServiceIds: string[] = Array.isArray(rawServices) && rawServices.length > 0
        ? rawServices
        : (cust.service ? [cust.service] : []);

      const custServicesList: string[] = custServiceIds
        .map((id: string) => services.find(s => s.id === id)?.name)
        .filter(Boolean);

      const serviceName = custServicesList.length > 0 ? custServicesList.join(', ') : 'Unassigned';
      const hasMedical = custServicesList.some((s: string) => s.toLowerCase().includes('medical'));
      const hasGeneral = custServicesList.some((s: string) => s.toLowerCase().includes('general'));

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
        servicesList: custServicesList,
        hasMedical,
        hasGeneral,
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
        (serviceFilter === 'escort' && c.hasMedical) ||
        (serviceFilter === 'general' && c.hasGeneral);

      // Payment filter
      const matchPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter;

      return matchSearch && matchService && matchPayment;
    });
  }, [processedCustomers, search, serviceFilter, paymentFilter]);

  const isFiltered = Boolean(search.trim() || serviceFilter !== 'all' || paymentFilter !== 'all');

  // Open Full Customer Dossier
  const handleOpenCustomer = async (cust: any) => {
    let mFiles = medifMap[cust.id] || cust.medifFiles || [];
    setSelectedCustomer({ ...cust, medifFiles: mFiles });
    setLoadingPassports(true);
    setCustomerPassports([]);

    // Fetch MEDIF on-demand for this customer in parallel if not yet cached
    if (!mFiles || mFiles.length === 0) {
      fetchCustomerMedif(cust.id, cust.hasMedical).then((fetched) => {
        if (fetched && fetched.length > 0) {
          setSelectedCustomer((prev: any) =>
            prev && prev.id === cust.id ? { ...prev, medifFiles: fetched } : prev
          );
        }
      });
    }

    try {
      const bucket = cust.hasMedical ? 'medical_escort' : 'general_service';
      if (cust.passport && Array.isArray(cust.passport) && cust.passport.length > 0) {
        const filesData = await Promise.all(
          cust.passport.map(async (file: any) => {
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
            return {
              name: file.name || 'Passport Document',
              type: (file.name || '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
              url: signedUrl || '',
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
        /* Top Header */
        .vault-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: #4F5DFF; background: #EEF1FF; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .back-link:hover { background: #e0e7ff; }

        /* Search & Filters */
        .filter-bar { display: flex !important; gap: 12px !important; margin-bottom: 22px !important; flex-wrap: wrap !important; align-items: center !important; justify-content: space-between !important; }
        .search-group { display: flex !important; align-items: center !important; gap: 10px !important; flex: 1 1 540px !important; min-width: 0 !important; max-width: 740px !important; }
        .search-box { position: relative !important; flex: 1 1 300px !important; min-width: 0 !important; }
        .search-box input { width: 100% !important; min-width: 0 !important; height: 42px !important; padding: 0 14px 0 38px !important; border-radius: 10px !important; border: 1px solid #cbd5e1 !important; font-size: 14px !important; outline: none !important; transition: border-color 0.2s, box-shadow 0.2s !important; box-sizing: border-box !important; background: #ffffff !important; color: #0f172a !important; }
        .search-box input:focus { border-color: #64748b !important; box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.15) !important; }
        .search-box .search-icon { position: absolute !important; left: 12px !important; top: 50% !important; transform: translateY(-50%) !important; color: #94a3b8 !important; font-size: 20px !important; pointer-events: none !important; }
        
        .vault-total-box { display: inline-flex !important; align-items: center !important; gap: 8px !important; height: 42px !important; padding: 0 14px !important; background: #ffffff !important; border: 1.5px solid #cbd5e1 !important; border-radius: 10px !important; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important; flex-shrink: 0 !important; user-select: none !important; white-space: nowrap !important; transition: all 0.2s ease !important; box-sizing: border-box !important; }
        .vault-total-box:hover { border-color: #94a3b8 !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important; }
        .vault-total-label { font-size: 13px !important; font-weight: 700 !important; color: #475569 !important; letter-spacing: 0.01em !important; }
        .vault-total-badge { background: #f1f5f9 !important; color: #0f172a !important; font-size: 14px !important; font-weight: 800 !important; padding: 3px 10px !important; border-radius: 6px !important; border: 1px solid #cbd5e1 !important; display: inline-flex !important; align-items: baseline !important; }
        .vault-total-sub { font-size: 11px !important; font-weight: 600 !important; color: #64748b !important; margin-left: 3px !important; }
        
        .select-filter { height: 42px !important; padding: 0 14px !important; border-radius: 10px !important; border: 1px solid #cbd5e1 !important; background: #fff !important; font-size: 13px !important; font-weight: 500 !important; color: #334155 !important; outline: none !important; cursor: pointer !important; box-sizing: border-box !important; }

        /* Table */
        .table-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .vault-table { width: 100%; min-width: 1050px; border-collapse: collapse; text-align: left; }
        .vault-table th { background: #f8fafc; padding: 14px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1.5px solid #cbd5e1; white-space: nowrap; }
        .vault-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #cbd5e1; vertical-align: middle; }
        .vault-table tr:hover { background: #fafbff; }
        .vault-table tr:last-child td { border-bottom: none; }

        /* Skeleton Loading */
        .skeleton-row td { padding: 16px !important; border-bottom: 1px solid #e2e8f0 !important; }
        .skeleton-cell {
          height: 18px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.4s infinite ease-in-out;
          border-radius: 4px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

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
        .view-action-btn { background: #f1f5f9; color: #334155; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s ease; white-space: nowrap; }
        .view-action-btn:hover { background: #e2e8f0; color: #0f172a; }

        /* Modal Backdrop & Container */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Media queries */
        @media (max-width: 768px) {
          .vault-page { padding: 16px 12px calc(75px + env(safe-area-inset-bottom)) !important; }
          .vault-top h1 { font-size: 22px !important; margin-top: 8px !important; }
          .filter-bar { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .search-group { width: 100% !important; max-width: 100% !important; display: flex !important; gap: 8px !important; }
          .search-box { min-width: 0 !important; max-width: none !important; width: 100% !important; flex: 1 !important; }
          .vault-total-box { height: 40px !important; padding: 0 10px !important; }
          .vault-total-label { font-size: 12px !important; }
          .vault-total-badge { font-size: 13px !important; padding: 2px 7px !important; }
          .filter-bar > div:last-child { width: 100% !important; display: flex !important; gap: 8px !important; }
          .select-filter { flex: 1 !important; width: 100% !important; font-size: 12px !important; padding: 8px 10px !important; height: 38px !important; }
          .vault-table th, .vault-table td { padding: 10px 12px !important; font-size: 13px !important; }
          .vault-table { min-width: 820px !important; }
        }
      `}} />

      <main className="vault-page">
        {/* Top Header */}
        <div className="vault-top">
          <div>
            <Link href="/dashboard" className="back-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
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
          <div className="search-group">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search by Customer Name, Iqama, Passport No, MEDIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div
              className="vault-total-box"
              id="vault-total-box"
              title={isFiltered ? `Showing ${filteredCustomers.length} of ${processedCustomers.length} total dossiers` : `Total ${processedCustomers.length} dossiers in vault`}
            >
              <span className="vault-total-label">Total:</span>
              <span className="vault-total-badge">
                {loading ? '...' : (
                  <>
                    {filteredCustomers.length}
                    {isFiltered && (
                      <span className="vault-total-sub">/{processedCustomers.length}</span>
                    )}
                  </>
                )}
              </span>
            </div>
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
                  <TableSkeleton rows={7} cols={6} />
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
                          {customer.servicesList && customer.servicesList.length > 0 ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {customer.servicesList.map((name: string, idx: number) => {
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
                          )}
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
                                <strong>SAR {customer.totalAmount.toLocaleString()}</strong>
                                {customer.totalBalance > 0 ? (
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>(Bal: SAR {customer.totalBalance.toLocaleString()})</span>
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

      {/* Customer Dossier Modal */}
      {selectedCustomer && (
        <CustomerDossierModal
          selectedCustomer={selectedCustomer}
          customerPassports={customerPassports}
          loadingPassports={loadingPassports}
          uploadingMedif={uploadingMedif}
          onClose={() => setSelectedCustomer(null)}
          onPreviewFile={setFullscreenFile}
          onUploadMedif={handleUploadMedif}
          onDeleteMedif={handleDeleteMedif}
        />
      )}

      {/* Nurse Details Modal */}
      {selectedNurse && (
        <NurseDetailsModal
          selectedNurse={selectedNurse}
          onClose={() => setSelectedNurse(null)}
        />
      )}

      {/* Fullscreen File Viewer */}
      {fullscreenFile && (
        <FullscreenFileViewer
          file={fullscreenFile}
          onClose={() => setFullscreenFile(null)}
        />
      )}
    </>
  );
}
