'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';
import { GenerateSalarySlipModal } from './components';

export default function SalaryPage(props: any) {
  const embedded = props?.embedded ?? false;
  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setActionError('');

    try {
      const [salRes, empRes] = await Promise.all([
        supabaseAuth.from('employee_salaries').select('*').order('month', { ascending: false }),
        supabaseAuth.from('employees').select('id, name, iqama_number, email, department, job_title').order('name', { ascending: true })
      ]);

      if (salRes.error) console.error("Salaries fetch error:", salRes.error);
      if (empRes.error) console.error("Employees fetch error:", empRes.error);

      if (empRes.data) {
        setEmployees(empRes.data);
      }

      if (salRes.data) {
        const empMapById = new Map();
        const empMapByIqama = new Map();

        if (empRes.data) {
          empRes.data.forEach((e: any) => {
            empMapById.set(e.id, e);
            empMapByIqama.set(e.iqama_number, e);
          });
        }

        const mapped = salRes.data.map((d: any) => {
          const emp = (d.employee_id && empMapById.get(d.employee_id)) || empMapByIqama.get(d.employee_iqama);
          return {
            ...d,
            employees: {
              id: emp?.id || d.employee_id || null,
              name: emp?.name || 'Unknown',
              iqama_number: emp?.iqama_number || d.employee_iqama,
              department: emp?.department || '',
              job_title: emp?.job_title || ''
            }
          };
        });

        setSalaries(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching salary records:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateSalarySlip = async (data: {
    employeeId: string;
    employeeIqama: string;
    month: string;
    basicSalary: number;
    status: string;
  }) => {
    const toInsert: any = {
      employee_id: data.employeeId,
      employee_iqama: data.employeeIqama,
      month: data.month,
      basic_salary: data.basicSalary,
      advance_payment: 0,
      deductions: 0,
      net_salary: data.basicSalary,
      status: data.status
    };

    let { error } = await supabaseAuth.from('employee_salaries').insert([toInsert]);

    // Graceful fallback if employee_id column doesn't exist yet in remote DB
    if (
      error &&
      (error.message?.toLowerCase().includes('employee_id') ||
        (error as any).code === 'PGRST204' ||
        (error as any).code === '42703')
    ) {
      const { employee_id, ...fallbackToInsert } = toInsert;
      const retry = await supabaseAuth.from('employee_salaries').insert([fallbackToInsert]);
      error = retry.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    setShowGenerateModal(false);
    await fetchData();
  };

  const handleDeleteSlip = async (id: string, empName: string, month: string) => {
    if (!confirm(`Are you sure you want to delete the salary slip for ${empName} (${month})?`)) {
      return;
    }

    const { error } = await supabaseAuth.from('employee_salaries').delete().eq('id', id);
    if (error) {
      alert("Error deleting salary slip: " + error.message);
    } else {
      fetchData();
    }
  };

  const filteredSalaries = salaries.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = s.employees?.name?.toLowerCase() || '';
    const iqama = (s.employee_iqama || '').toLowerCase();
    const empId = (s.employee_id || '').toLowerCase();
    const month = (s.month || '').toLowerCase();
    return name.includes(q) || iqama.includes(q) || empId.includes(q) || month.includes(q);
  });

  return (
    <div className={embedded ? "" : styles.container}>
      <GenerateSalarySlipModal
        isOpen={showGenerateModal}
        employees={employees}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleGenerateSalarySlip}
      />

      {!embedded && (
        <Link href="/admin/directory" className={styles.backBtn} style={{ marginBottom: '15px' }}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Directory
        </Link>
      )}

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span className="material-symbols-outlined">error</span>
          {actionError}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
            Monthly employee salary records, deductions, and payment status linked by employee ID.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '18px'
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Filter by name, ID, month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '220px'
              }}
            />
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            style={{
              background: '#4F5DFF',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              boxShadow: '0 1px 2px rgba(79, 93, 255, 0.2)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              payments
            </span>{' '}
            Generate Salary Slip
          </button>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Month
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Employee Details
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Basic Salary
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Deductions
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Net Salary
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Status
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading Salary Records...
              </td>
            </tr>
          ) : filteredSalaries.length > 0 ? (
            filteredSalaries.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{s.month}</strong>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#0f172a' }}>{s.employees?.name || 'Unknown'}</strong>
                      {s.employee_id && (
                        <span
                          title={`Employee UUID: ${s.employee_id}`}
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            borderRadius: '4px',
                            border: '1px solid #dbeafe',
                            fontFamily: 'monospace'
                          }}
                        >
                          ID: {s.employee_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Iqama: {s.employee_iqama || s.employees?.iqama_number || '—'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>${Number(s.basic_salary || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: Number(s.deductions || 0) > 0 ? '#ef4444' : '#64748b' }}>
                  {Number(s.deductions || 0) > 0 ? `-$${Number(s.deductions).toLocaleString()}` : '$0'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                  ${Number(s.net_salary || 0).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: s.status === 'Paid' ? '#dcfce7' : '#fef08a',
                      color: s.status === 'Paid' ? '#166534' : '#854d0e',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    {s.status || 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      href={`/admin/directory/salary/slip/${s.id}`}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title="View Salary Slip"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        visibility
                      </span>
                      View
                    </Link>
                    <Link
                      href={`/admin/directory/salary/${s.id}`}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title="Edit Salary"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        edit
                      </span>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlip(s.id, s.employees?.name || 'Employee', s.month)}
                      title="Delete salary slip"
                      style={{
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: 'none',
                        padding: 0,
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                {searchQuery ? 'No matching salary records found.' : 'No salary records found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
