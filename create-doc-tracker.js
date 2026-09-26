const fs = require('fs');

const content = `
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabaseAuth';

const LoadingIcon = () => (
  <svg style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DocumentationTracker() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: genService } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
    
    if (genService) {
      const [cRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name, service_type').eq('service', genService.id),
        supabaseAuth.from('doc_service_types').select('*')
      ]);
      
      if (dRes.data) setDocTypes(dRes.data);
      if (cRes.data) {
        // Only show customers who actually have documentation services requested
        const activeDocs = cRes.data.filter((c: any) => c.service_type && c.service_type.length > 0);
        setCustomers(activeDocs);
      }
    }
    setLoading(false);
  }

  const renderDocNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return 'None';
    return ids.map(id => docTypes.find(d => d.id === id)?.name).filter(Boolean).join(', ');
  };

  return (
    <>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: #f8fafc; padding: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 0.875rem; }
        .data-table tr:hover { background-color: #f8fafc; }
        .btn-action { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #0f172a; text-decoration: none; transition: all 0.2s; }
        .btn-action:hover { background: #f1f5f9; border-color: #cbd5e1; }
      `}</style>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Documentation Tracker</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>Active document processing for General Service customers</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Requested Documents</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><LoadingIcon /></div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {c.service_type.map((id: string) => {
                          const name = docTypes.find(d => d.id === id)?.name;
                          return name ? (
                            <span key={id} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>
                              {name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td>
                      <Link href={`/customers/${c.id}`} className="btn-action">
                        Update
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No pending documentation requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
`;

fs.mkdirSync('src/app/documentation', { recursive: true });
fs.writeFileSync('src/app/documentation/page.tsx', content);

// Re-add to Dashboard
let dash = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
if (!dash.includes('/documentation')) {
  dash = dash.replace(/<\/div>\s*<\/div>\s*<\/div>/, 
`  <div className="service-card" onClick={() => router.push('/documentation')} style={{ cursor: 'pointer', background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', color: '#0f172a' }}>Documentation</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>Manage visas, passports, and medical certificates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`);
  fs.writeFileSync('src/app/dashboard/page.tsx', dash);
}

console.log('Recreated Documentation Tracker');
