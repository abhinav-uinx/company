"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';

const LoadingIcon = () => (
  <svg style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DocumentationPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCustomer, setViewCustomer] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: genService } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
    
    if (genService) {
      const [cRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').eq('service', genService.id).order('created_at', { ascending: false }),
        supabaseAuth.from('doc_service_types').select('*')
      ]);
      
      if (dRes.data) setDocTypes(dRes.data);
      if (cRes.data) {
        setCustomers(cRes.data);
      }
    }
    setLoading(false);
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
      `}
        @media (max-width: 600px) {
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 15px; }
        }
      </style>
      
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
                customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.nationality || '-'}</td>
                    <td>{c.contact_number || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {c.service_type && c.service_type.length > 0 ? c.service_type.map((id: string) => {
                          const name = docTypes.find(d => d.id === id)?.name;
                          return name ? (
                            <span key={id} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>
                              {name}
                            </span>
                          ) : null;
                        }) : <span style={{ color: '#94a3b8' }}>None</span>}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => setViewCustomer(c)} className="btn-action">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No General Service customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="hide-scrollbar" style={{ background: '#fff', padding: '0', borderRadius: '16px', width: '95%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#e0f2fe', color: '#0369a1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">folder_shared</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>General Service Details</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Customer: <span style={{ fontWeight: 600, color: '#0369a1' }}>{viewCustomer.name}</span></p>
                </div>
              </div>
              <button onClick={() => setViewCustomer(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Personal Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Nationality</div>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewCustomer.nationality || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Contact Number</div>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewCustomer.contact_number || '-'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Requested Documents</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {viewCustomer.service_type && viewCustomer.service_type.length > 0 ? viewCustomer.service_type.map((id: string) => {
                          const name = docTypes.find(d => d.id === id)?.name;
                          return name ? (
                            <span key={id} style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #bae6fd' }}>
                              {name}
                            </span>
                          ) : null;
                        }) : <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No documents requested.</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Link href={`/documentation/${viewCustomer.id}`} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#0f172a', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Edit Customer</Link>
              <button onClick={() => setViewCustomer(null)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
