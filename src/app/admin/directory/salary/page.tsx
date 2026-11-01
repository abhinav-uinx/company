'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';
import { GenerateSalarySlipModal, SalaryFilterDropdown, MonthOption } from './components';

export default function SalaryPage(props: any) {
  const embedded = props?.embedded ?? false;
  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');

  const formatDepartment = (deptStr: string) => {
    if (!deptStr || deptStr === 'N/A') return 'N/A';
    let formatted = deptStr;
    formatted = formatted.replace(/d69ccefc-045a-4bb1-8c27-99120e16610b/gi, 'Nurse');
    formatted = formatted.replace(/Human Resources/gi, 'HR');
    return formatted.split(',').map(s => s.trim()).filter(Boolean).join(' / ');
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setActionError('');

    try {
      const [salRes, empRes, deptRes] = await Promise.all([
        supabaseAuth.from('employee_salaries').select('*').order('month', { ascending: false }),
        supabaseAuth.from('employees').select('id, name, iqama_number, email, department, department_id, job_title').order('name', { ascending: true }),
        supabaseAuth.from('departments').select('*').order('name')
      ]);

      if (salRes.error) console.error("Salaries fetch error:", salRes.error);
      if (empRes.error) console.error("Employees fetch error:", empRes.error);
      if (deptRes.error) console.error("Departments fetch error:", deptRes.error);

      const depts = deptRes.data || [];
      setDepartments(depts);
      const deptMap: Record<string, string> = {};
      depts.forEach((d: any) => { deptMap[d.id] = d.name; });

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
          const rawDept = emp?.department_id || emp?.department || '';
          const resolvedDept = deptMap[rawDept] || rawDept || 'N/A';
          const formattedDept = formatDepartment(resolvedDept);

          return {
            ...d,
            employees: {
              id: emp?.id || d.employee_id || null,
              name: emp?.name || 'Unknown',
              iqama_number: emp?.iqama_number || d.employee_iqama,
              department: formattedDept,
              job_title: emp?.job_title || '',
              email: emp?.email || ''
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

  const ALL_MONTHS: MonthOption[] = [
    { value: '01', label: 'January', short: 'Jan' },
    { value: '02', label: 'February', short: 'Feb' },
    { value: '03', label: 'March', short: 'Mar' },
    { value: '04', label: 'April', short: 'Apr' },
    { value: '05', label: 'May', short: 'May' },
    { value: '06', label: 'June', short: 'Jun' },
    { value: '07', label: 'July', short: 'Jul' },
    { value: '08', label: 'August', short: 'Aug' },
    { value: '09', label: 'September', short: 'Sep' },
    { value: '10', label: 'October', short: 'Oct' },
    { value: '11', label: 'November', short: 'Nov' },
    { value: '12', label: 'December', short: 'Dec' },
  ];

  const parseYearAndMonth = (monthStr?: string) => {
    if (!monthStr) return { year: '', monthNum: '' };
    const parts = monthStr.split('-');
    return {
      year: parts[0] || '',
      monthNum: parts[1] || ''
    };
  };

  const availableDepartments = Array.from(new Set([
    ...departments.map(d => formatDepartment(d.name)),
    ...salaries.map(s => s.employees?.department || 'N/A')
  ])).filter(d => d && d !== 'N/A').sort();

  const availableYears = Array.from(new Set(
    salaries
      .map(s => parseYearAndMonth(s.month).year)
      .filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));
  const currentYearStr = new Date().getFullYear().toString();
  if (!availableYears.includes(currentYearStr)) {
    availableYears.unshift(currentYearStr);
  }

  const monthsWithCount: MonthOption[] = ALL_MONTHS.map(m => {
    const count = salaries.filter(s => parseYearAndMonth(s.month).monthNum === m.value).length;
    return { ...m, count };
  });

  const handleToggleDepartment = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const handleSelectAllDepartments = () => {
    setSelectedDepartments([]);
  };

  const handleToggleMonth = (mVal: string) => {
    setSelectedMonths(prev =>
      prev.includes(mVal) ? prev.filter(m => m !== mVal) : [...prev, mVal]
    );
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths([]);
  };

  const handleToggleYear = (yVal: string) => {
    setSelectedYears(prev =>
      prev.includes(yVal) ? prev.filter(y => y !== yVal) : [...prev, yVal]
    );
  };

  const handleSelectAllYears = () => {
    setSelectedYears([]);
  };

  const handleResetAllFilters = () => {
    setSelectedDepartments([]);
    setSelectedMonths([]);
    setSelectedYears([]);
    setSearchQuery('');
  };

  const filteredSalaries = salaries.filter((s) => {
    // 1. Department filter
    if (selectedDepartments.length > 0) {
      const empDept = s.employees?.department || 'N/A';
      if (!selectedDepartments.includes(empDept)) {
        return false;
      }
    }

    // 2. Month and Year filter
    const { year: recYear, monthNum: recMonthNum } = parseYearAndMonth(s.month);

    if (selectedYears.length > 0) {
      if (!selectedYears.includes(recYear)) {
        return false;
      }
    }

    if (selectedMonths.length > 0) {
      if (!selectedMonths.includes(recMonthNum)) {
        return false;
      }
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (s.employees?.name || '').toLowerCase();
      const iqama = (s.employee_iqama || '').toLowerCase();
      const empId = (s.employee_id || '').toLowerCase();
      const month = (s.month || '').toLowerCase();
      const status = (s.status || '').toLowerCase();
      const dept = (s.employees?.department || '').toLowerCase();
      const jobTitle = (s.employees?.job_title || '').toLowerCase();
      const email = (s.employees?.email || '').toLowerCase();
      const basic = String(s.basic_salary || '');
      const net = String(s.net_salary || '');
      return (
        name.includes(q) ||
        iqama.includes(q) ||
        empId.includes(q) ||
        month.includes(q) ||
        status.includes(q) ||
        dept.includes(q) ||
        jobTitle.includes(q) ||
        email.includes(q) ||
        basic.includes(q) ||
        net.includes(q)
      );
    }

    return true;
  });

  return (
    <div className={embedded ? "" : styles.container} style={{ minHeight: '80vh' }}>
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

      {/* Subtitle Description */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          Monthly employee salary records, deductions, and payment status linked by employee ID.
        </p>
      </div>

      {/* Full-width Action Toolbar: Search on left, Actions & Filters at utmost right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%'
        }}
      >
        {/* Left Side: Search Bar */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '18px',
              pointerEvents: 'none'
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search employee, ID, month, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 34px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4F5DFF';
              e.target.style.boxShadow = '0 0 0 3px rgba(79, 93, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>

        {/* Right Side Actions: Generate Salary Slip, and at the UTMOST RIGHT: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
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

          <SalaryFilterDropdown
            departments={availableDepartments}
            selectedDepartments={selectedDepartments}
            onToggleDepartment={handleToggleDepartment}
            onSelectAllDepartments={handleSelectAllDepartments}
            months={monthsWithCount}
            selectedMonths={selectedMonths}
            onToggleMonth={handleToggleMonth}
            onSelectAllMonths={handleSelectAllMonths}
            years={availableYears}
            selectedYears={selectedYears}
            onToggleYear={handleToggleYear}
            onSelectAllYears={handleSelectAllYears}
            onResetAll={handleResetAllFilters}
            filteredCount={filteredSalaries.length}
            totalCount={salaries.length}
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedDepartments.length > 0 || selectedMonths.length > 0 || selectedYears.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
          {selectedDepartments.map((dept) => (
            <span
              key={`dept-chip-${dept}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '2px 9px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              Dept: {dept}
              <button
                type="button"
                onClick={() => handleToggleDepartment(dept)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Remove department filter"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            </span>
          ))}
          {selectedMonths.map((mVal) => {
            const mLabel = ALL_MONTHS.find(m => m.value === mVal)?.label || mVal;
            return (
              <span
                key={`month-chip-${mVal}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '2px 9px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                Month: {mLabel}
                <button
                  type="button"
                  onClick={() => handleToggleMonth(mVal)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  title="Remove month filter"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </span>
            );
          })}
          {selectedYears.map((yVal) => (
            <span
              key={`year-chip-${yVal}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '2px 9px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              Year: {yVal}
              <button
                type="button"
                onClick={() => handleToggleYear(yVal)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Remove year filter"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleResetAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '2px 6px',
              textDecoration: 'underline'
            }}
          >
            Clear all
          </button>
        </div>
      )}

      <div className="tableWrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <table
        style={{
          width: '100%',
          minWidth: '700px',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden'
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Iqama: {s.employee_iqama || s.employees?.iqama_number || '—'}
                      </span>
                      {s.employees?.department && s.employees.department !== 'N/A' && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            background: '#f1f5f9',
                            color: '#475569',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          {s.employees.department}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>SAR {Number(s.basic_salary || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: Number(s.deductions || 0) > 0 ? '#ef4444' : '#64748b' }}>
                  {Number(s.deductions || 0) > 0 ? `-SAR ${Number(s.deductions).toLocaleString()}` : 'SAR 0'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                  SAR {Number(s.net_salary || 0).toLocaleString()}
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
                {searchQuery.trim() || selectedDepartments.length > 0 || selectedMonths.length > 0 || selectedYears.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span>No salary records matching the selected filters or search query.</span>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  'No salary records found.'
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
