"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import { supabaseAuth } from '@/lib/supabase';
import { GeneralServiceDetailsModal } from './components';
import TableSkeleton from '@/components/TableSkeleton';
import {
  getGeneralServicesCache,
  setGeneralServicesCache,
  getDocTypesCache,
  setDocTypesCache
} from './docCache';

export default function DocumentationPage() {
  const [customers, setCustomers] = useState<any[]>(() => getGeneralServicesCache() || []);
  const { role, isFolderAllowed } = useAuth();
  const [docTypes, setDocTypes] = useState<any[]>(() => getDocTypesCache() || []);
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = getGeneralServicesCache();
    return !cached || cached.length === 0;
  });
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const hasCache = (getGeneralServicesCache()?.length || 0) > 0;
    fetchData(!hasCache);
  }, [role, isFolderAllowed]);

  async function fetchData(showSpinner = false) {
    if (showSpinner) setLoading(true);

    try {
      const cachedTypes = getDocTypesCache();
      const fetchTypes = !cachedTypes || cachedTypes.length === 0;

      const [recRes, dRes] = await Promise.all([
        supabaseAuth
          .from('general_service_records')
          .select('*, customers(id, name, contact_number, nationality)')
          .order('created_at', { ascending: false }),
        fetchTypes ? supabaseAuth.from('doc_service_types').select('*') : Promise.resolve({ data: cachedTypes })
      ]);

      if (dRes?.data) {
        setDocTypes(dRes.data);
        setDocTypesCache(dRes.data);
      }
      if (recRes?.data) {
        setCustomers(recRes.data);
        setGeneralServicesCache(recRes.data);
      }
    } catch (err) {
      console.error('Error fetching general services:', err);
    } finally {
      setLoading(false);
    }
  }
  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'done' || s === 'completed') {
      return {
        background: '#ecfdf5',
        color: '#065f46',
        borderColor: '#a7f3d0'
      };
    }
    return {
      background: '#fffbeb',
      color: '#92400e',
      borderColor: '#fde68a'
    };
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const dbStatus = newStatus === 'Done' ? 'Completed' : newStatus;

    // Instant optimistic update
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, status: dbStatus } : c));
      setGeneralServicesCache(updated);
      return updated;
    });
    if (viewCustomer && viewCustomer.id === id) {
      setViewCustomer((prev: any) => (prev ? { ...prev, status: dbStatus } : null));
    }

    // Silent background sync
    try {
      const { error } = await supabaseAuth
        .from('general_service_records')
        .update({ status: dbStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + err.message);
      fetchData(false);
    }
  };

  if (role === 'employee' && !isFolderAllowed('general_services')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>General Services</strong> folder. Please contact an administrator.
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
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 15px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; }
        .data-table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
        .data-table th { background: #f8fafc; padding: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 0.875rem; vertical-align: middle; }
        .data-table tr:hover { background-color: #f8fafc; }
        .btn-action { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #0f172a; text-decoration: none; transition: all 0.2s; gap: 8px; }
        .btn-action:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .btn-primary { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: background 0.2s; cursor: pointer; }
        .btn-primary:hover { background: #1e293b; }

        .status-dot-pending {
          width: 5.5px;
          height: 5.5px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
          flex-shrink: 0;
          animation: pulseDot 2s ease-in-out infinite;
        }
        .status-dot-done {
          width: 5.5px;
          height: 5.5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
          flex-shrink: 0;
        }

        .status-pill {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 0.72rem;
          line-height: 1.2;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .status-pill:hover {
          transform: translateY(-1px);
        }
        .status-pill-pending {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }
        .status-pill-pending:hover {
          background: #fef3c7;
          border-color: #f59e0b;
          box-shadow: 0 3px 8px rgba(245, 158, 11, 0.15);
        }
        .status-pill-done {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .status-pill-done:hover {
          background: #d1fae5;
          border-color: #10b981;
          box-shadow: 0 3px 8px rgba(16, 185, 129, 0.15);
        }

        .btn-table-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          text-decoration: none;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .btn-table-action:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .btn-table-edit {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #2563eb;
          text-decoration: none;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(37,99,235,0.05);
        }
        .btn-table-edit:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(37,99,235,0.25);
        }

        .btn-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          display: inline-block;
        }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
          .table-container { border-radius: 8px; }
          .data-table th, .data-table td { padding: 12px; font-size: 0.8rem; }
        }
      `}</style>
      
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Link href="/dashboard" className="back-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
        </Link>
        <div className="page-header">
          <div>
            <h1 className="page-title">General Services</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>Overview of all General Service customers and documentation</p>
          </div>
          <Link href="/documentation/new" className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            New Customer
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Nationality</th>
                <th>Contact</th>
                <th>Requested Documents</th>
                <th>Status</th>
                <th style={{ minWidth: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={6} rows={4} />
              ) : customers.length > 0 ? (
                customers.map((rec: any) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 500 }}>{rec.customers?.name || '-'}</td>
                    <td>{rec.customers?.nationality || '-'}</td>
                    <td>{rec.customers?.contact_number || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rec.service_ids && rec.service_ids.length > 0 ? rec.service_ids.map((id: string) => {
                          const svc = docTypes.find((d: any) => d.id === id);
                          return svc ? (
                            <span key={id} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>
                              {svc.name}
                            </span>
                          ) : null;
                        }) : <span style={{ color: '#94a3b8' }}>None</span>}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const isDone = (rec.status || '').toLowerCase() === 'done' || (rec.status || '').toLowerCase() === 'completed';
                        const isUpdating = updatingId === rec.id;
                        return (
                          <div
                            className={`status-pill ${isDone ? 'status-pill-done' : 'status-pill-pending'}`}
                            title="Click to change status"
                          >
                            {isUpdating ? (
                              <span className="btn-spinner" style={{ width: '10px', height: '10px', color: isDone ? '#065f46' : '#92400e' }} />
                            ) : isDone ? (
                              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#059669', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            ) : null}
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1 }}>
                              {isUpdating ? 'Updating...' : (isDone ? 'Done' : 'Pending')}
                            </span>
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: '13px',
                                opacity: 0.7,
                                marginLeft: '0px'
                              }}
                            >
                              expand_more
                            </span>

                            {/* Full-coverage native select overlay */}
                            <select
                              value={isDone ? 'Done' : 'Pending'}
                              onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                              disabled={isUpdating}
                              aria-label="Change status"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: isUpdating ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setViewCustomer(rec)}
                          className="btn-table-action"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          View
                        </button>
                        <Link
                          href={`/documentation/${rec.id}`}
                          className="btn-table-edit"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No documentation requests yet.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      <GeneralServiceDetailsModal
        viewCustomer={viewCustomer}
        docTypes={docTypes}
        onClose={() => setViewCustomer(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}






