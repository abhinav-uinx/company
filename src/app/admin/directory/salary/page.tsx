'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';

import TableSkeleton from '@/components/TableSkeleton';

export default function SalaryPage(props: any) {
  const embedded = props?.embedded ?? false;
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabaseAuth.from('employee_salaries').select('*').order('month', { ascending: false });
    if (error) console.error(error);
    if (data) {
      const empRes = await supabaseAuth.from('employees').select('iqama_number, name');
      const empMap: Record<string, string> = {};
      if (empRes.data) empRes.data.forEach(e => empMap[e.iqama_number] = e.name);
      
      const mapped = data.map(d => ({ ...d, employees: { name: empMap[d.employee_iqama] || 'Unknown' } }));
      setSalaries(mapped);
    }
    setLoading(false);
  }

  const generateSlip = async () => {
    const iqama = prompt("Enter Employee Iqama:");
    const month = prompt("Enter Month (YYYY-MM):", new Date().toISOString().slice(0, 7));
    if (!iqama || !month) return;
    
    const { error } = await supabaseAuth.from('employee_salaries').insert([{
      employee_iqama: iqama,
      month: month,
      basic_salary: 3000,
      net_salary: 3000,
      status: 'Pending'
    }]);
    if (error) alert("Error generating slip: " + error.message);
    else fetchData();
  };

  return (
    <div className={embedded ? "" : styles.container}>
      {!embedded && (
        <Link href="/admin/directory" className={styles.backBtn} style={{ marginBottom: '15px' }}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Directory
        </Link>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Monthly employee salary records, deductions, and payment status.</p>
        <button onClick={generateSlip} style={{ background: '#4F5DFF', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span> Generate Salary Slip
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Month</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Employee Name</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Basic Salary</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Deductions</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Net Salary</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading Salary Records...</td></tr>
          ) : salaries.length > 0 ? (
            salaries.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px' }}><strong>{s.month}</strong></td>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{s.employees?.name || 'Unknown'}</strong><br/>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.employee_iqama}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>${Number(s.basic_salary || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: Number(s.deductions || 0) > 0 ? '#ef4444' : '#64748b' }}>
                  {Number(s.deductions || 0) > 0 ? `-$${Number(s.deductions).toLocaleString()}` : '$0'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>${Number(s.net_salary || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    background: s.status === 'Paid' ? '#dcfce7' : '#fef08a', 
                    color: s.status === 'Paid' ? '#166534' : '#854d0e',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    {s.status || 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link href={`/admin/directory/salary/slip/${s.id}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span> View
                    </Link>
                    <Link href={`/admin/directory/salary/${s.id}`} style={{ color: '#4F5DFF', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No salary records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}






