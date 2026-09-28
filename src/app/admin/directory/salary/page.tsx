'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';

import TableSkeleton from '@/components/TableSkeleton';

export default function SalaryPage() {
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
    <div className={styles.container}>
      <Link href="/admin/directory" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Directory
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Salary & Payroll</h1>
        <button onClick={generateSlip} className={styles.addBtn}>
          <span className="material-symbols-outlined">payments</span> Generate Salary Slip
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Employee Name</th>
              <th>Basic Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={7} />
            ) : salaries.length > 0 ? (
              salaries.map(s => (
                <tr key={s.id}>
                  <td>{s.month}</td>
                  <td>{s.employees?.name || s.employee_iqama}</td>
                  <td>${s.basic_salary}</td>
                  <td style={{ color: 'red' }}>-${s.deductions}</td>
                  <td style={{ fontWeight: 'bold' }}>${s.net_salary}</td>
                  <td style={{ color: s.status === 'Paid' ? 'green' : 'orange' }}>{s.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <Link href={`/admin/directory/salary/slip/${s.id}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span> View
                      </Link>
                      <Link href={`/admin/directory/salary/${s.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>No salary records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}






