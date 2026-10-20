'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import LoadingIcon from '@/components/LoadingIcon';
import { CustomerDossierModal, NurseDetailsModal, FullscreenFileViewer } from './components';

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
      const custServicesList: string[] = Array.isArray(cust.services) && cust.services.length > 0
        ? cust.services.map((id: string) => services.find(s => s.id === id)?.name).filter(Boolean)
        : [services.find(s => s.id === cust.service)?.name].filter(Boolean);
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

  // Open Full Customer Dossier
  const handleOpenCustomer = async (cust: any) => {
    const mFiles = medifMap[cust.id] || cust.medifFiles || [];
    setSelectedCustomer({ ...cust, medifFiles: mFiles });
    setLoadingPassports(true);
    setCustomerPassports([]);

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

        .modal-card {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 980px;
          height: 90vh;
          max-height: 860px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        @keyframes modalZoomIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          padding: 18px 26px;
          background: linear-gradient(135deg, #0B1220 0%, #172338 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Sticky Subnav Bar with Tabs */
        .modal-subnav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
        }
        .subnav-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 0;
          width: 100%;
        }
        .subnav-tabs::-webkit-scrollbar {
          display: none;
        }
        .subnav-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          flex-shrink: 0;
        }
        .subnav-tab-btn:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .subnav-tab-btn.active {
          color: #4F5DFF;
          background: #EEF1FF;
          border-color: #c7d2fe;
        }
        .subnav-tab-btn .material-symbols-outlined {
          font-size: 16px;
        }
        .subnav-tab-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #475569;
        }
        .subnav-tab-btn.active .subnav-tab-badge {
          background: #4F5DFF;
          color: #ffffff;
        }

        /* Modal Body & Custom Professional Scrollbar */
        .modal-body {
          padding: 22px 28px 48px;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #f8fafc;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
          position: relative;
        }
        .modal-body::-webkit-scrollbar {
          width: 7px;
        }
        .modal-body::-webkit-scrollbar-track {
          background: transparent;
          margin: 6px 0;
        }
        .modal-body::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
          border: 1px solid #f8fafc;
        }
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Refined Human-Crafted Cards */
        .modal-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
          transition: border-color 0.15s ease;
          scroll-margin-top: 10px;
        }
        .modal-section:hover {
          border-color: #cbd5e1;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .section-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }
        .section-icon-box .material-symbols-outlined {
          font-size: 20px;
        }
        .section-title-wrap {
          display: flex;
          flex-direction: column;
        }
        .section-main-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-sub-desc {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }

        /* Financial KPI Grid */
        .financial-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .kpi-value {
          font-size: 17px;
          font-weight: 700;
        }
        .text-slate { color: #0f172a; }
        .text-emerald { color: #059669; }
        .text-rose { color: #e11d48; }

        /* General Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #f8fafc;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
        .info-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .info-val {
          font-size: 13.5px;
          font-weight: 600;
          color: #0f172a;
          word-break: break-word;
        }
        .info-val.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          letter-spacing: 0.02em;
        }

        /* Floating Back to Top Button */
        .back-to-top-btn {
          position: absolute;
          bottom: 24px;
          right: 24px;
          z-index: 40;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          animation: modalFadeIn 0.2s ease;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .back-to-top-btn:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        /* Modal Footer */
        .modal-footer {
          padding: 14px 26px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.04);
        }

        /* Media queries */
        @media (max-width: 768px) {
          .vault-page { padding: 20px 12px; }
          .modal-card { max-height: 95vh; height: 95vh; border-radius: 14px; }
          .modal-header { padding: 14px 18px; }
          .modal-subnav { padding: 8px 14px; }
          .modal-body { padding: 16px 14px 36px; }
          .modal-footer { padding: 12px 16px; flex-direction: column; gap: 10px; align-items: stretch; }
          .info-grid { grid-template-columns: 1fr; }
          .financial-kpi-grid { grid-template-columns: 1fr 1fr; }
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
                          {customer.servicesList && customer.servicesList.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {customer.servicesList.map((sName: string, sIdx: number) => {
                                const isMed = sName.toLowerCase().includes('medical');
                                return (
                                  <span
                                    key={sIdx}
                                    className="badge badge-service"
                                    style={{
                                      background: isMed ? '#eef2ff' : '#f0f9ff',
                                      color: isMed ? '#4338ca' : '#0369a1',
                                      borderColor: isMed ? '#c7d2fe' : '#bae6fd'
                                    }}
                                  >
                                    {sName}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="badge badge-service">
                              {customer.serviceName}
                            </span>
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
