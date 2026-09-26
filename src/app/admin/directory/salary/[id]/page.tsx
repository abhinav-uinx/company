'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import styles from '@/app/customers/customers.module.css'; // Reuse form styles

export default function EditSalaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [employeeIqama, setEmployeeIqama] = useState('');
  const [employeeName, setEmployeeName] = useState('Unknown');
  const [month, setMonth] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [deductionComment, setDeductionComment] = useState('');
  const [status, setStatus] = useState('Pending');

  useEffect(() => {
    fetchSalary();
  }, [id]);

  async function fetchSalary() {
    setLoading(true);
    const { data, error } = await supabaseAuth.from('employee_salaries').select('*').eq('id', id).single();
    if (data) {
      setEmployeeIqama(data.employee_iqama);
      setMonth(data.month);
      setBasicSalary(data.basic_salary || 0);
      setAdvancePayment(data.advance_payment || 0);
      setDeductions(data.deductions || 0);
      setDeductionComment(data.deduction_comment || '');
      setStatus(data.status || 'Pending');
      
      // Fetch employee name
      const { data: empData } = await supabaseAuth.from('employees').select('name').eq('iqama_number', data.employee_iqama).single();
      if (empData) setEmployeeName(empData.name);
    } else if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    
    // Auto-calculate net salary
    const netSalary = (Number(basicSalary) || 0) - (Number(advancePayment) || 0) - (Number(deductions) || 0);

    const { error } = await supabaseAuth.from('employee_salaries').update({
      basic_salary: Number(basicSalary),
      advance_payment: Number(advancePayment),
      deductions: Number(deductions),
      deduction_comment: deductionComment,
      net_salary: netSalary,
      status: status
    }).eq('id', id);

    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/admin/directory/salary');
      router.refresh();
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading salary record...</div>;

  return (
    <div className={styles.container}>
      <Link href="/admin/directory/salary" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Salary List
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Salary Record</h1>
        <Link href={`/admin/directory/salary/slip/${id}`} className={styles.addBtn} style={{ textDecoration: 'none', background: '#0ea5e9' }}>
          <span className="material-symbols-outlined">receipt_long</span> View Slip
        </Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        {errorMsg && (
          <div style={{ padding: '15px', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
            <span className="material-symbols-outlined">error</span>
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Employee Info Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '56px', height: '56px', background: '#e0f2fe', color: '#0ea5e9', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>person</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{employeeName}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Iqama: {employeeIqama} <span style={{ margin: '0 10px', color: '#cbd5e1' }}>|</span> Month: <strong style={{ color: '#0f172a' }}>{month}</strong></p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Left Column: Earnings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>account_balance_wallet</span> Earnings
              </h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Basic Salary (USD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 600 }}>$</span>
                  <input 
                    type="number" step="0.01" value={basicSalary} onChange={e => setBasicSalary(parseFloat(e.target.value) || 0)} required 
                    style={{ width: '100%', padding: '14px 15px 14px 35px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Payment Status</label>
                <select 
                  value={status} onChange={e => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '14px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '1rem', outline: 'none', appearance: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="Pending">Pending (Unpaid)</option>
                  <option value="Paid">Paid (Cleared)</option>
                </select>
              </div>
            </div>

            {/* Right Column: Deductions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '20px' }}>money_off</span> Deductions
              </h3>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Advance Payment Recovery (USD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: 600 }}>-$</span>
                  <input 
                    type="number" step="0.01" value={advancePayment} onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', padding: '14px 15px 14px 40px', borderRadius: '10px', border: '1px solid #fca5a5', background: '#fef2f2', fontSize: '1rem', outline: 'none', color: '#b91c1c', fontWeight: 500 }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = '#fca5a5'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Other Deductions / Fines (USD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: 600 }}>-$</span>
                  <input 
                    type="number" step="0.01" value={deductions} onChange={e => setDeductions(parseFloat(e.target.value) || 0)} 
                    style={{ width: '100%', padding: '14px 15px 14px 40px', borderRadius: '10px', border: '1px solid #fca5a5', background: '#fef2f2', fontSize: '1rem', outline: 'none', color: '#b91c1c', fontWeight: 500 }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = '#fca5a5'}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Deduction Reason (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" value={deductionComment} onChange={e => setDeductionComment(e.target.value)} placeholder="e.g. Late arrival penalty"
                    style={{ width: '100%', padding: '14px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Net Pay Calculator */}
          <div style={{ padding: '30px', background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)', borderRadius: '16px', border: '2px dashed #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '40px', background: '#d1fae5', padding: '10px', borderRadius: '12px' }}>savings</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Final Calculation</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#064e3b' }}>Total Net Pay</div>
              </div>
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#15803d', letterSpacing: '-1.5px' }}>
              ${((Number(basicSalary) || 0) - (Number(advancePayment) || 0) - (Number(deductions) || 0)).toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px', paddingTop: '30px', borderTop: '1px solid #e2e8f0' }}>
            <Link href="/admin/directory/salary" className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '14px 28px', textDecoration: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
               Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-submit" style={{ background: '#0ea5e9', padding: '14px 32px', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', color: '#fff', boxShadow: '0 4px 10px -2px rgba(14, 165, 233, 0.4)' }}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Saving...' : 'Save Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
