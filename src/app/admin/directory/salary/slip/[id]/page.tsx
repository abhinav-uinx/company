'use client';

import { useEffect, useState } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SalarySlipPage() {
  const params = useParams();
  const id = params.id as string;
  const [slip, setSlip] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (id) fetchSlipData();
  }, [id]);

  async function fetchSlipData() {
    // 1. Fetch Salary Record
    const { data: salaryData } = await supabaseAuth.from('employee_salaries').select('*').eq('id', id).single();
    if (salaryData) {
      setSlip(salaryData);
      
      // 2. Fetch Employee Record
      const { data: empData } = await supabaseAuth.from('employees').select('*').eq('iqama_number', salaryData.employee_iqama).single();
      if (empData) setEmployee(empData);
    }
  }

  if (!slip) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading Salary Slip...</div>;
  }

  // Format dates
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const [year, monthNum] = slip.month.split('-');
  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('en-US', { month: 'long' });

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Non-printable controls */}
      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin/directory/salary" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> Back to Salary List
        </Link>
        <button 
          onClick={() => window.print()}
          style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}
        >
          <span className="material-symbols-outlined">print</span> Print / Save PDF
        </button>
      </div>

      {/* Printable Slip Container */}
      <div className="printable-slip" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '50px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: '#0f172a' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '25px', marginBottom: '30px' }}>
          <div>
            <img src="/Assets/Company logo/main_logo.png" alt="MEDESCORT INTERNATIONAL logo" style={{ height: '60px', marginBottom: '10px' }} />
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 700 }}>MEDESCORT INTERNATIONAL</h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Global Medical Logistics & Escort Services</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#0ea5e9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Payslip</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 500 }}>{monthName} {year}</p>
          </div>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>Employee Details</h3>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', width: '100px' }}>Name:</td>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>{employee?.name || 'Unknown Employee'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>Iqama / ID:</td>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>{slip.employee_iqama}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>Email:</td>
                  <td style={{ padding: '6px 0', fontWeight: 500 }}>{employee?.email || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>Payment Details</h3>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', width: '100px' }}>Pay Period:</td>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>{monthName} {year}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>Date Issued:</td>
                  <td style={{ padding: '6px 0', fontWeight: 500 }}>{printDate}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>Status:</td>
                  <td style={{ padding: '6px 0', fontWeight: 700, color: slip.status === 'Paid' ? '#10b981' : '#f59e0b' }}>{slip.status.toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Breakdown */}
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0f172a' }}>Salary Breakdown</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: 'white' }}>
              <th style={{ padding: '12px 15px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Description</th>
              <th style={{ padding: '12px 15px', textAlign: 'right' }}>Earnings (USD)</th>
              <th style={{ padding: '12px 15px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Deductions (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '15px', fontWeight: 500 }}>Basic Salary</td>
              <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600 }}>${parseFloat(slip.basic_salary).toFixed(2)}</td>
              <td style={{ padding: '15px', textAlign: 'right', color: '#64748b' }}>-</td>
            </tr>
            {parseFloat(slip.advance_payment) > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px', fontWeight: 500 }}>Advance Payment Recovery</td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#64748b' }}>-</td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>${parseFloat(slip.advance_payment).toFixed(2)}</td>
              </tr>
            )}
            {parseFloat(slip.deductions) > 0 && (
              <>
                <tr style={{ borderBottom: slip.deduction_comment ? 'none' : '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px 15px 5px 15px', fontWeight: 500 }}>Other Deductions / Fines</td>
                  <td style={{ padding: '15px 15px 5px 15px', textAlign: 'right', color: '#64748b' }}>-</td>
                  <td style={{ padding: '15px 15px 5px 15px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>${parseFloat(slip.deductions).toFixed(2)}</td>
                </tr>
                {slip.deduction_comment && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td colSpan={3} style={{ padding: '0 15px 15px 15px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                      Reason: {slip.deduction_comment}
                    </td>
                  </tr>
                )}
              </>
            )}
            
            {/* Total Block */}
            <tr>
              <td style={{ padding: '20px 15px 15px 15px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>Net Pay</td>
              <td colSpan={2} style={{ padding: '20px 15px 15px 15px', textAlign: 'right', fontWeight: 800, fontSize: '1.4rem', color: '#0ea5e9', borderTop: '2px solid #0f172a' }}>
                ${parseFloat(slip.net_salary).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginTop: '60px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '10px' }}></div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Employer Signature</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', height: '40px', marginBottom: '10px' }}></div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Employee Signature</p>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <p style={{ margin: 0 }}>This is a system generated payslip and does not require a physical signature if issued digitally.</p>
          <p style={{ margin: '5px 0 0 0' }}>MEDESCORT INTERNATIONAL &copy; {new Date().getFullYear()}</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-slip, .printable-slip * {
            visibility: visible;
          }
          .printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}





