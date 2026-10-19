'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/app/admin/dashboard/header';
import styles from '@/app/customers/customers.module.css';
import { getRevenueReportData } from '../exports/revenue/exportRevenueReport';
import * as XLSX from 'xlsx';

export default function RevenueReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getRevenueReportData();
      if (result) setData(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <>
      <Header />
      <div className={styles.container}>
        <Link href="/admin/reports" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Reports
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Revenue & Invoice Report</h1>
        <button 
          onClick={handleDownload}
          disabled={data.length === 0}
          className={styles.addBtn}
          style={{ opacity: data.length === 0 ? 0.5 : 1, cursor: data.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          <span className="material-symbols-outlined">download</span> Download Excel
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading report data...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No records found.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {headers.map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {headers.map(header => (
                      <td key={header}>{row[header]?.toString() || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
