'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../patients/patients.module.css';

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    ongoingMissions: 0,
    totalRevenue: 0,
    pendingDocs: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [pRes, mRes, iRes, dRes] = await Promise.all([
        supabaseAuth.from('patients').select('id', { count: 'exact', head: true }),
        supabaseAuth.from('escort_missions').select('id', { count: 'exact', head: true }).eq('status', 'In-Transit'),
        supabaseAuth.from('invoices').select('total_amount').eq('status', 'Paid'),
        supabaseAuth.from('documentation_services').select('id', { count: 'exact', head: true }).in('status', ['Applied', 'In Process'])
      ]);

      const rev = iRes.data ? iRes.data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) : 0;

      setStats({
        totalPatients: pRes.count || 0,
        ongoingMissions: mRes.count || 0,
        totalRevenue: rev,
        pendingDocs: dRes.count || 0
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Cloud Admin Reports & Analytics</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>Total Patients</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.totalPatients}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>Ongoing Escorts</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563eb' }}>{loading ? '...' : stats.ongoingMissions}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>Total Revenue</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a' }}>${loading ? '...' : stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>Pending Documents</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c' }}>{loading ? '...' : stats.pendingDocs}</div>
        </div>
      </div>

      <div className={styles.card} style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>Export Detailed Reports</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 500, color: '#334155' }}>
            <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>public</span> Patient Report (Country-wise)</span>
            <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>download</span>
          </button>
          <button style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 500, color: '#334155' }}>
            <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>request_quote</span> Revenue & Invoice Report</span>
            <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>download</span>
          </button>
          <button style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 500, color: '#334155' }}>
            <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>group</span> Employee Salary & Attendance Report</span>
            <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>download</span>
          </button>
          <button style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 500, color: '#334155' }}>
            <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>insights</span> Service-wise Profit Report</span>
            <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
