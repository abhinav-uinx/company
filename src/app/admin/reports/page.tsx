'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import Header from '@/app/admin/dashboard/header';
import styles from '@/app/customers/customers.module.css';
import * as XLSX from 'xlsx';
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

  // Active preview toggle: 'customers' | 'revenue' | 'employees' | 'services' | null
  const [activePreview, setActivePreview] = useState<string | null>(null);

  // 1. Customer Report state
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loadingTopCustomers, setLoadingTopCustomers] = useState(false);
  const [downloadingCustomers, setDownloadingCustomers] = useState(false);

  // 2. Revenue Report state
  const [topInvoices, setTopInvoices] = useState<any[]>([]);
  const [loadingTopInvoices, setLoadingTopInvoices] = useState(false);
  const [downloadingRevenue, setDownloadingRevenue] = useState(false);

  // 3. Employee Salary & Attendance state
  const [topEmployees, setTopEmployees] = useState<any[]>([]);
  const [loadingTopEmployees, setLoadingTopEmployees] = useState(false);
  const [downloadingEmployees, setDownloadingEmployees] = useState(false);

  // 4. Service-wise Profit state
  const [topServices, setTopServices] = useState<any[]>([]);
  const [loadingTopServices, setLoadingTopServices] = useState(false);
  const [downloadingServices, setDownloadingServices] = useState(false);

  // Toggle and load preview
  const handleTogglePreview = async (reportId: string) => {
    if (activePreview === reportId) {
      setActivePreview(null);
      return;
    }

    setActivePreview(reportId);

    if (reportId === 'customers' && topCustomers.length === 0) {
      setLoadingTopCustomers(true);
      try {
        const { data } = await supabaseAuth
          .from('customers')
          .select('id, name, nationality, passport_no, contact_number')
          .order('nationality', { ascending: true })
          .limit(10);
        if (data) setTopCustomers(data);
      } catch (err) {
        console.error('Failed to load customer preview:', err);
      } finally {
        setLoadingTopCustomers(false);
      }
    } else if (reportId === 'revenue' && topInvoices.length === 0) {
      setLoadingTopInvoices(true);
      try {
        const { data } = await supabaseAuth
          .from('invoices')
          .select('id, total_amount, advance_payment, balance_amount, status, created_at, customers(name)')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setTopInvoices(data);
      } catch (err) {
        console.error('Failed to load revenue preview:', err);
      } finally {
        setLoadingTopInvoices(false);
      }
    } else if (reportId === 'employees' && topEmployees.length === 0) {
      setLoadingTopEmployees(true);
      try {
        const data = await getEmployeeReportData();
        if (data) setTopEmployees(data.slice(0, 10));
      } catch (err) {
        console.error('Failed to load employee preview:', err);
      } finally {
        setLoadingTopEmployees(false);
      }
    } else if (reportId === 'services' && topServices.length === 0) {
      setLoadingTopServices(true);
      try {
        const data = await getServiceProfitReportData();
        if (data) setTopServices(data);
      } catch (err) {
        console.error('Failed to load service preview:', err);
      } finally {
        setLoadingTopServices(false);
      }
    }
  };

  // 1-Click Excel Download Handlers
  const handleDownloadCustomerReport = async () => {
    try {
      setDownloadingCustomers(true);
      const exportData = await getCustomerReportData();
      if (exportData && exportData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');
        XLSX.writeFile(wb, `Customer_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error('Error downloading customer report:', err);
      alert('Failed to download customer report.');
    } finally {
      setDownloadingCustomers(false);
    }
  };

  const handleDownloadRevenueReport = async () => {
    try {
      setDownloadingRevenue(true);
      const exportData = await getRevenueReportData();
      if (exportData && exportData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Revenue');
        XLSX.writeFile(wb, `Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error('Error downloading revenue report:', err);
      alert('Failed to download revenue report.');
    } finally {
      setDownloadingRevenue(false);
    }
  };

  const handleDownloadEmployeeReport = async () => {
    try {
      setDownloadingEmployees(true);
      const exportData = await getEmployeeReportData();
      if (exportData && exportData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Employee_Salary');
        XLSX.writeFile(wb, `Employee_Salary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error('Error downloading employee report:', err);
      alert('Failed to download employee salary report.');
    } finally {
      setDownloadingEmployees(false);
    }
  };

  const handleDownloadServiceProfitReport = async () => {
    try {
      setDownloadingServices(true);
      const exportData = await getServiceProfitReportData();
      if (exportData && exportData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Service_Profit');
        XLSX.writeFile(wb, `Service_Profit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error('Error downloading service profit report:', err);
      alert('Failed to download service profit report.');
    } finally {
      setDownloadingServices(false);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      const [pRes, mRes, iRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('id', { count: 'exact', head: true }),
        supabaseAuth.from('escort_missions').select('id', { count: 'exact', head: true }).eq('status', 'In-Transit'),
        supabaseAuth.from('invoices').select('total_amount').eq('status', 'Paid'),
        supabaseAuth.from('general_service_records').select('id', { count: 'exact', head: true }).in('status', ['Applied', 'In Process', 'Pending', 'In Progress'])
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

  const reportDefinitions = [
    {
      id: 'customers',
      title: 'Customer Directory (Country-wise)',
      category: 'Demographics & Registry',
      icon: 'public',
      description: 'Customer profiles categorized by nationality and country of origin, with passport ID and contact records.',
      href: '/admin/reports/customers',
      downloadHandler: handleDownloadCustomerReport,
      isDownloading: downloadingCustomers,
      loadingPreview: loadingTopCustomers,
      previewData: topCustomers
    },
    {
      id: 'revenue',
      title: 'Revenue & Invoice Ledger',
      category: 'Finance & Invoicing',
      icon: 'request_quote',
      description: 'Invoicing audit trails, total contract revenues, advance collections, and outstanding balance dues.',
      href: '/admin/reports/revenue',
      downloadHandler: handleDownloadRevenueReport,
      isDownloading: downloadingRevenue,
      loadingPreview: loadingTopInvoices,
      previewData: topInvoices
    },
    {
      id: 'employees',
      title: 'Employee Salary & Attendance',
      category: 'Payroll & Human Resources',
      icon: 'badge',
      description: 'Comprehensive staff payroll ledger, monthly basic salaries, allowances, deductions, and attendance summaries.',
      href: '/admin/reports/employees',
      downloadHandler: handleDownloadEmployeeReport,
      isDownloading: downloadingEmployees,
      loadingPreview: loadingTopEmployees,
      previewData: topEmployees
    },
    {
      id: 'services',
      title: 'Service-wise Profit Report',
      category: 'Operations & Analytics',
      icon: 'insights',
      description: 'Gross revenue breakdown, profit distributions, and volume analytics grouped by medical and general services.',
      href: '/admin/reports/services',
      downloadHandler: handleDownloadServiceProfitReport,
      isDownloading: downloadingServices,
      loadingPreview: loadingTopServices,
      previewData: topServices
    }
  ];

  return (
    <>
      <Header />
      <div className={styles.container}>
        <style dangerouslySetInnerHTML={{ __html: `
          .reports-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 16px;
            margin-bottom: 28px;
          }
          .reports-summary-card {
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .reports-export-box {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            padding: 24px;
            margin-bottom: 30px;
          }
          .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
            gap: 18px;
          }
          .report-item-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px 20px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.2s ease;
          }
          .report-item-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .report-item-card.has-preview {
            border-color: #94a3b8;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          }
          .report-action-btn-secondary {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 7px 12px;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s ease;
            box-sizing: border-box;
          }
          .report-action-btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 16px;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            background: #0f172a;
            color: #ffffff;
            transition: all 0.15s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .report-action-btn-primary:hover {
            background: #1e293b;
          }
          .report-action-btn-primary:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }
          @media (max-width: 900px) {
            .reports-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        <Link href="/admin/dashboard" className={styles.backBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
        </Link>
      
        <div className={styles.header} style={{ marginBottom: '22px' }}>
          <div>
            <h1 className={styles.title} style={{ margin: '0 0 4px 0', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              Cloud Admin Reports &amp; Analytics
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
              Real-time executive summaries, customer demographics, financial statements, and staff reports.
            </p>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div className="reports-summary-grid">
          <div className="reports-summary-card">
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>groups</span>
              Total Customers
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : stats.totalCustomers.toLocaleString()}
            </div>
          </div>

          <div className="reports-summary-card">
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>flight_takeoff</span>
              Ongoing Escorts
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : stats.ongoingMissions.toLocaleString()}
            </div>
          </div>

          <div className="reports-summary-card">
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>payments</span>
              Total Revenue
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              SAR {loading ? '...' : stats.totalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="reports-summary-card">
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>pending_actions</span>
              Pending Documents
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : stats.pendingDocs.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Export Detailed Reports Box */}
        <div className="reports-export-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0f172a' }}>
                assessment
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Export Detailed Reports
                </h2>
                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                  Generate, preview sample records, and export comprehensive spreadsheets.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 9px', borderRadius: '6px' }}>
                4 Reports Available
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 9px', borderRadius: '6px' }}>
                Excel (.xlsx) Ready
              </span>
            </div>
          </div>

          {/* 4 Report Cards Grid */}
          <div className="reports-grid">
            {reportDefinitions.map((report) => {
              const isPreviewOpen = activePreview === report.id;

              return (
                <div
                  key={report.id}
                  className={`report-item-card ${isPreviewOpen ? 'has-preview' : ''}`}
                >
                  {/* Top Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#334155',
                            flexShrink: 0
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                            {report.icon}
                          </span>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                            {report.title}
                          </h3>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                            {report.category}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 7px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>table_view</span>
                        XLSX
                      </span>
                    </div>

                    <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '12px 0 16px 0', lineHeight: 1.45 }}>
                      {report.description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(report.id)}
                        className="report-action-btn-secondary"
                        style={{
                          background: isPreviewOpen ? '#0f172a' : '#f8fafc',
                          color: isPreviewOpen ? '#ffffff' : '#334155',
                          border: isPreviewOpen ? '1px solid #0f172a' : '1px solid #cbd5e1'
                        }}
                        title={isPreviewOpen ? 'Hide preview table' : 'Preview top records'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {isPreviewOpen ? 'expand_less' : 'visibility'}
                        </span>
                        {isPreviewOpen ? 'Close' : 'Preview'}
                      </button>

                      <Link
                        href={report.href}
                        className="report-action-btn-secondary"
                        style={{
                          background: '#ffffff',
                          color: '#475569',
                          border: '1px solid #e2e8f0'
                        }}
                        title="Open full report page with all records and search"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          open_in_new
                        </span>
                        Full View
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={report.downloadHandler}
                      disabled={report.isDownloading}
                      className="report-action-btn-primary"
                      title="Download complete report as Excel spreadsheet"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        download
                      </span>
                      {report.isDownloading ? 'Exporting...' : 'Export Excel'}
                    </button>
                  </div>

                  {/* Expandable Preview Area */}
                  {isPreviewOpen && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid #e2e8f0',
                        animation: 'fadeIn 0.2s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Sample Preview
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          Live Database Snapshot
                        </span>
                      </div>

                      {report.loadingPreview ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                          Loading report records...
                        </div>
                      ) : !report.previewData || report.previewData.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                          No records found in this category.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '240px', WebkitOverflowScrolling: 'touch' }}>
                          {/* 1. Customer Report Preview Table */}
                          {report.id === 'customers' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '7px 10px', width: '32px', color: '#64748b', fontWeight: 700 }}>#</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Customer Name</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Nationality</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Passport / ID</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.previewData.map((c: any, idx: number) => (
                                  <tr key={c.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '7px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f172a' }}>{c.name || 'Unnamed'}</td>
                                    <td style={{ padding: '7px 10px', color: '#334155' }}>{c.nationality || 'Unspecified'}</td>
                                    <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace' }}>{c.passport_no || c.contact_number || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* 2. Revenue Report Preview Table */}
                          {report.id === 'revenue' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '7px 10px', width: '32px', color: '#64748b', fontWeight: 700 }}>#</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Customer</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Total</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Advance</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Balance</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.previewData.map((inv: any, idx: number) => (
                                  <tr key={inv.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '7px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f172a' }}>{inv.customers?.name || 'Unknown'}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f172a' }}>SAR {Number(inv.total_amount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '7px 10px', color: '#334155' }}>SAR {Number(inv.advance_payment || 0).toLocaleString()}</td>
                                    <td style={{ padding: '7px 10px', color: '#334155' }}>SAR {Number(inv.balance_amount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '7px 10px', color: '#475569' }}>{inv.status || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* 3. Employee Report Preview Table */}
                          {report.id === 'employees' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '7px 10px', width: '32px', color: '#64748b', fontWeight: 700 }}>#</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Month</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Employee Name</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Department</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Basic Salary</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Net Pay</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.previewData.map((emp: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '7px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                                    <td style={{ padding: '7px 10px', color: '#475569' }}>{emp['Month'] || '-'}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f172a' }}>{emp['Employee Name'] || 'Unknown'}</td>
                                    <td style={{ padding: '7px 10px', color: '#334155' }}>{emp['Department'] || 'N/A'}</td>
                                    <td style={{ padding: '7px 10px', color: '#0f172a' }}>SAR {Number(emp['Basic Salary'] || 0).toLocaleString()}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#16a34a' }}>SAR {Number(emp['Net Salary'] || emp['Basic Salary'] || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* 4. Service Profit Report Preview Table */}
                          {report.id === 'services' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '7px 10px', width: '32px', color: '#64748b', fontWeight: 700 }}>#</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Service Category</th>
                                  <th style={{ padding: '7px 10px', color: '#475569', fontWeight: 700 }}>Gross Revenue Generated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.previewData.map((srv: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '7px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f172a' }}>{srv['Service Category']}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 700, color: '#0f172a' }}>SAR {Number(srv['Total Gross Revenue Generated'] || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Showing sample entries. Use <strong>Full View</strong> to search, filter, and inspect all records.
                        </span>
                        <Link
                          href={report.href}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            textDecoration: 'underline'
                          }}
                        >
                          Open in Full Page →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
