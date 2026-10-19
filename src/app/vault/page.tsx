'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import LoadingIcon from '@/components/LoadingIcon';

export default function Vault() {
  const { role, isFolderAllowed } = useAuth();
  const [activeTab, setActiveTab] = useState<'customers' | 'medif' | 'other'>('customers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Core Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [medifRecords, setMedifRecords] = useState<any[]>([]);

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Customer Full Dossier View Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerPassports, setCustomerPassports] = useState<any[]>([]);
  const [loadingPassports, setLoadingPassports] = useState(false);
  const [fullscreenFile, setFullscreenFile] = useState<any | null>(null);

  // Existing MEDIF Tab States (preserves all existing MEDIF actions & deletion)
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  // Fetch Vault Data
  const fetchAllVaultData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, sRes, invRes, payRes, mRes, medifRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('services').select('*'),
        supabaseAuth.from('invoices').select('*').order('created_at', { ascending: false }),
        supabaseAuth.from('payment_history').select('*').order('payment_date', { ascending: false }),
        supabaseAuth.from('escort_missions').select('*'),
        supabaseAuth.from('medif_records').select('*').order('created_at', { ascending: false })
      ]);

      if (cRes.error) throw cRes.error;
      if (sRes.data) setServices(sRes.data);
      if (invRes.data) setInvoices(invRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (mRes.data) setMissions(mRes.data);
      if (medifRes.data) setMedifRecords(medifRes.data);
      if (cRes.data) setCustomers(cRes.data);
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

  // Process Customers with Invoices, Payments, Missions, and MEDIFs
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

      // Customer MEDIF Records (matched by passport or passenger name)
      const custMedifs = medifRecords.filter(m => {
        const passMatch = cust.passport_no && m.passport && (m.passport.toLowerCase() === cust.passport_no.toLowerCase());
        const nameMatch = cust.name && m.patient_name && (m.patient_name.toLowerCase().includes(cust.name.toLowerCase()) || cust.name.toLowerCase().includes(m.patient_name.toLowerCase()));
        return passMatch || nameMatch;
      });

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
        custMedifs
      };
    });
  }, [customers, services, invoices, payments, missions, medifRecords]);

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
        (c.serviceName && c.serviceName.toLowerCase().includes(q));

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
    setSelectedCustomer(cust);
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

  // MEDIF Delete Handlers
  const handleDeleteMedif = async () => {
    if (selectedIds.length === 0) return;
    setDeleteIds(selectedIds);
    setShowConfirmModal(true);
  };

  const confirmDeleteMedif = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    const { error: delErr } = await supabaseAuth.from('medif_records').delete().in('id', deleteIds);
    if (delErr) {
      alert('Delete failed: ' + delErr.message);
    } else {
      setMedifRecords(prev => prev.filter(m => !deleteIds.includes(m.id)));
      setSelectedIds([]);
      setIsDeleteMode(false);
    }
    setLoading(false);
  };

  const toggleMedifSelection = (e: any, id: string) => {
    e.preventDefault();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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

  // Summary Counters
  const totalVaultCustomers = processedCustomers.length;
  const totalBilled = processedCustomers.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalCollected = processedCustomers.reduce((acc, c) => acc + c.totalAdvance, 0);
  const totalOutstanding = processedCustomers.reduce((acc, c) => acc + c.totalBalance, 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .vault-page { max-width: 1300px; margin: 0 auto; padding: 32px 24px; font-family: 'Inter', -apple-system, sans-serif; color: #0f172a; }
        .vault-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: #4F5DFF; background: #EEF1FF; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .back-link:hover { background: #e0e7ff; }
        
        /* Stats row */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 14px; }
        .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justifyContent: center; }
        .stat-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
        .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; }

        /* Tabs Navigation */
        .tabs-header { display: flex; gap: 12px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
        .tab-btn { background: none; border: none; padding: 12px 18px; font-size: 15px; font-weight: 700; color: #64748b; cursor: pointer; position: relative; display: flex; align-items: center; gap: 8px; transition: color 0.2s; }
        .tab-btn:hover { color: #0f172a; }
        .tab-btn.active { color: #4F5DFF; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: #4F5DFF; border-radius: 3px 3px 0 0; }

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
        .vault-table { width: 100%; min-width: 950px; border-collapse: collapse; text-align: left; }
        .vault-table th { background: #f8fafc; padding: 14px 18px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .vault-table td { padding: 15px 18px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .vault-table tr:hover { background: #fafbff; }
        .vault-table tr:last-child td { border-bottom: none; }

        /* Badges */
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-partial { background: #fef3c7; color: #b45309; }
        .badge-unpaid { background: #fee2e2; color: #b91c1c; }
        .badge-noinv { background: #f1f5f9; color: #64748b; }
        .badge-service { background: #EEF2FF; color: #4338CA; font-weight: 600; text-transform: none; }

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
              Document Vault &amp; Customer Dossiers
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Complete centralized records of entered customers, payments, travel IDs, MEDIFs, and vaulted documents.
            </p>
          </div>
        </div>

        {/* Top Financial & Customer Counters */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EEF1FF', color: '#4F5DFF' }}>
              <span className="material-symbols-outlined">folder_shared</span>
            </div>
            <div>
              <div className="stat-label">Total Customers</div>
              <div className="stat-val">{totalVaultCustomers}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <div className="stat-label">Total Invoiced</div>
              <div className="stat-val">${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div>
              <div className="stat-label">Advance Collected</div>
              <div className="stat-val">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: totalOutstanding > 0 ? '#fef2f2' : '#f8fafc', color: totalOutstanding > 0 ? '#ef4444' : '#64748b' }}>
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <div className="stat-label">Outstanding Balance</div>
              <div className="stat-val" style={{ color: totalOutstanding > 0 ? '#ef4444' : '#0f172a' }}>
                ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>group</span>
            Customer Vault Records ({filteredCustomers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'medif' ? 'active' : ''}`}
            onClick={() => setActiveTab('medif')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>clinical_notes</span>
            MEDIF Forms ({medifRecords.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
            Other Forms
          </button>
        </div>

        {/* TAB 1: CUSTOMERS VAULT TABLE (PRIMARY VIEW) */}
        {activeTab === 'customers' && (
          <div>
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="search-box">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search by Name, Iqama, Passport No, Nationality, Phone..."
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

            {/* Customers Table */}
            <div className="table-card">
              <div className="table-container">
                <table className="vault-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Name</th>
                      <th style={{ width: '15%' }}>Iqama</th>
                      <th style={{ width: '15%' }}>Passport No</th>
                      <th style={{ width: '14%' }}>Service</th>
                      <th style={{ width: '16%' }}>Payment Info</th>
                      <th style={{ width: '10%' }}>Contact</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '60px' }}>
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

                            {/* 6. Contact */}
                            <td>
                              <div style={{ fontSize: '13px', color: '#334155' }}>
                                {customer.contact_number || <span style={{ color: '#94a3b8' }}>N/A</span>}
                              </div>
                            </td>

                            {/* 7. Action: View Details */}
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
                        <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
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
          </div>
        )}

        {/* TAB 2: MEDIF FORMS (PRESERVED FUNCTIONALITY) */}
        {activeTab === 'medif' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', background: statusFilter === 'all' ? '#0B1220' : '#fff', color: statusFilter === 'all' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  All ({medifRecords.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', background: statusFilter === 'pending' ? '#0B1220' : '#fff', color: statusFilter === 'pending' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('done')}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', background: statusFilter === 'done' ? '#0B1220' : '#fff', color: statusFilter === 'done' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>

              <div>
                {isDeleteMode ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setIsDeleteMode(false); setSelectedIds([]); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleDeleteMedif} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Delete ({selectedIds.length})</button>
                  </div>
                ) : (
                  <button onClick={() => setIsDeleteMode(true)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete Mode
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {medifRecords
                .filter(m => statusFilter === 'all' || m.status === statusFilter)
                .map(medif => {
                  const pName = medif.patient_name || medif.passenger_name || 'Patient';
                  return (
                    <Link
                      key={medif.id}
                      href={`/vault/view?id=${medif.id}`}
                      style={{
                        background: '#ffffff',
                        border: selectedIds.includes(medif.id) ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        textDecoration: 'none',
                        color: 'inherit',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                      onClick={(e) => {
                        if (isDeleteMode) toggleMedifSelection(e, medif.id);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>picture_as_pdf</span>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Passport: {medif.passport || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <span>Status: <strong style={{ color: '#0f172a' }}>{medif.status || 'Active'}</strong></span>
                        <span>{new Date(medif.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: OTHER FORMS */}
        {activeTab === 'other' && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>draft</span>
            <h3 style={{ margin: '10px 0 6px 0', fontSize: '18px' }}>Other Form Vault</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Additional institutional and government forms are archived here.</p>
          </div>
        )}
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

              {/* 1. FINANCIAL & PAYMENT INFO (EXPLICIT USER REQUIREMENT) */}
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

              {/* 2. PRIMARY IDENTITY & CONTACT ("NAME, IQAMA, PASSPORT NO FIRST") */}
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

              {/* 3. VISA & IMMIGRATION DETAILS */}
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

              {/* 4. EMERGENCY CONTACTS */}
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

              {/* 5. MEDICAL INFORMATION */}
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

              {/* 6. ESCORT MISSIONS & OPERATIONAL SERVICE DATA */}
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

              {/* 7. ATTACHED DOCUMENTS & VAULT FILES */}
              <div className="modal-section">
                <div className="section-title">
                  <span className="material-symbols-outlined" style={{ color: '#4F5DFF' }}>attachment</span>
                  Vault Files, Passports &amp; Attachments
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

                {/* Associated MEDIFs */}
                {selectedCustomer.custMedifs && selectedCustomer.custMedifs.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Matched MEDIF Forms ({selectedCustomer.custMedifs.length}):
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {selectedCustomer.custMedifs.map((m: any) => (
                        <Link
                          key={m.id}
                          href={`/vault/view?id=${m.id}`}
                          target="_blank"
                          style={{
                            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
                            padding: '8px 12px', color: '#1d4ed8', fontSize: '12px', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                          MEDIF Record ({m.passport || m.id.substring(0, 6)}) &rarr;
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Delete Confirmation Modal for MEDIF */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>Confirm Deletion</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569' }}>
              Are you sure you want to delete {deleteIds.length} MEDIF document(s)?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDeleteMedif} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
