'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import Header from '@/app/admin/dashboard/header';
import styles from '@/app/customers/customers.module.css';
import ReportsDashboardTool from './excel-export/ReportsDashboard';
import PreviewModal from './components/PreviewModal';
import { getCustomerReportData } from './exports/customers/exportCustomerReport';
import { getRevenueReportData } from './exports/revenue/exportRevenueReport';
import { getEmployeeReportData } from './exports/employees/exportEmployeeReport';
import { getServiceProfitReportData } from './exports/services/exportServiceProfitReport';

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    ongoingMissions: 0,
    totalRevenue: 0,
    pendingDocs: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [pRes, mRes, iRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('id', { count: 'exact', head: true }),
        supabaseAuth.from('escort_missions').select('id', { count: 'exact', head: true }).eq('status', 'In-Transit'),
        supabaseAuth.from('invoices').select('total_amount').eq('status', 'Paid'),
        supabaseAuth.from('general_service_records').select('id', { count: 'exact', head: true }).in('status', ['Applied', 'In Process'])
      ]);

      const rev = iRes.data ? iRes.data.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) : 0;

      setStats({
        totalCustomers: pRes.count || 0,
        ongoingMissions: mRes.count || 0,
        totalRevenue: rev,
        pendingDocs: dRes.count || 0
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <Link href="/admin/dashboard" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Cloud Admin Reports & Analytics</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '5px' }}>Total Customers</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.totalCustomers}</div>
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
          <Link href="/admin/reports/customers" style={{ textDecoration: 'none' }}>
            <button className={styles.reportBtn}>
              <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>public</span> Customer Report (Country-wise)</span>
              <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>visibility</span>
            </button>
          </Link>
          <Link href="/admin/reports/revenue" style={{ textDecoration: 'none' }}>
            <button className={styles.reportBtn}>
              <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>request_quote</span> Revenue & Invoice Report</span>
              <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>visibility</span>
            </button>
          </Link>
          <Link href="/admin/reports/employees" style={{ textDecoration: 'none' }}>
            <button className={styles.reportBtn}>
              <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>group</span> Employee Salary & Attendance Report</span>
              <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>visibility</span>
            </button>
          </Link>
          <Link href="/admin/reports/services" style={{ textDecoration: 'none' }}>
            <button className={styles.reportBtn}>
              <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '10px' }}>insights</span> Service-wise Profit Report</span>
              <span className="material-symbols-outlined" style={{ color: '#2563eb' }}>visibility</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Embedded Excel Export & Tax Calculator Tool */}
      <ReportsDashboardTool />
    </div>
    </>
  );
}
