"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import { supabaseAuth } from '@/lib/supabase';
import { GeneralServiceDetailsModal } from './components';

const LoadingIcon = () => (
  <svg style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DocumentationPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const { role, isFolderAllowed } = useAuth();
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCustomer, setViewCustomer] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [role, isFolderAllowed]);

  async function fetchData() {
    setLoading(true);

    const [recRes, dRes] = await Promise.all([
      // Join general_service_records with customer info
      supabaseAuth
        .from('general_service_records')
        .select('*, customers(id, name, contact_number, nationality)')
        .order('created_at', { ascending: false }),
      supabaseAuth.from('doc_service_types').select('*')
    ]);

    if (dRes.data) setDocTypes(dRes.data);
    if (recRes.data) setCustomers(recRes.data);
    setLoading(false);
  }

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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; }
        .data-table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
        .data-table th { background: #f8fafc; padding: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 0.875rem; }
        .data-table tr:hover { background-color: #f8fafc; }
        .btn-action { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #0f172a; text-decoration: none; transition: all 0.2s; gap: 8px; }
        .btn-action:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .btn-primary { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: background 0.2s; cursor: pointer; }
        .btn-primary:hover { background: #1e293b; }
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
          .table-container { border-radius: 8px; }
          .data-table th, .data-table td { padding: 12px; font-size: 0.8rem; }
        }
      `}</style>
      
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500, marginBottom: '20px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          Back to Dashboard
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
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><LoadingIcon /></div>
                  </td>
                </tr>
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
                      <span style={{
                        padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: rec.status === 'Completed' ? '#dcfce7' : rec.status === 'In Progress' ? '#fef9c3' : rec.status === 'Cancelled' ? '#fee2e2' : '#f1f5f9',
                        color: rec.status === 'Completed' ? '#166534' : rec.status === 'In Progress' ? '#854d0e' : rec.status === 'Cancelled' ? '#991b1b' : '#475569'
                      }}>{rec.status || 'Pending'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setViewCustomer(rec)} className="btn-action">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                          View
                        </button>
                        <Link href={`/documentation/${rec.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
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
      />
    </>
  );
}






