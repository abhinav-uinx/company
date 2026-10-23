'use client';

import { useState, useEffect } from 'react';

interface EmployeeItem {
  id: string;
  name: string;
  iqama_number: string;
  email?: string;
  department?: string;
  job_title?: string;
}

interface GenerateSalarySlipModalProps {
  isOpen: boolean;
  employees: EmployeeItem[];
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    employeeIqama: string;
    month: string;
    basicSalary: number;
    status: string;
  }) => Promise<void>;
}

export default function GenerateSalarySlipModal({
  isOpen,
  employees,
  onClose,
  onSubmit
}: GenerateSalarySlipModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [month, setMonth] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(3000);
  const [status, setStatus] = useState('Pending');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Default to current year-month (e.g., 2026-10)
      setMonth(new Date().toISOString().slice(0, 7));
      setBasicSalary(3000);
      setStatus('Pending');
      setError('');
      setShowSearch(false);
      setSearchQuery('');
      if (employees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(employees[0].id);
      }
    }
  }, [isOpen, employees, selectedEmployeeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!month) {
      setError('Please select a valid salary month.');
      return;
    }
    if (isNaN(basicSalary) || basicSalary < 0) {
      setError('Please enter a valid basic salary amount.');
      return;
    }

    const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
    if (!selectedEmp) {
      setError('Selected employee not found.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        employeeId: selectedEmp.id,
        employeeIqama: selectedEmp.iqama_number,
        month,
        basicSalary: Number(basicSalary),
        status
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate salary slip.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedEmp = employees.find(e => e.id === selectedEmployeeId);

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.iqama_number && emp.iqama_number.toLowerCase().includes(q)) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.id && emp.id.toLowerCase().includes(q))
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                payments
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Generate Salary Slip
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Create a new monthly salary record linked with employee ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: submitting ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Select Employee <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {showSearch && (
                <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 500 }}>
                  Search active ({filteredEmployees.length} {filteredEmployees.length === 1 ? 'match' : 'matches'})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
                disabled={submitting}
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {filteredEmployees.length === 0 ? (
                  <option value="">No matching employees found</option>
                ) : (
                  filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — Iqama: {emp.iqama_number} {emp.job_title ? `(${emp.job_title})` : ''}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => {
                  setShowSearch(prev => !prev);
                  if (showSearch) setSearchQuery('');
                }}
                disabled={submitting}
                style={{
                  height: '42px',
                  width: '42px',
                  borderRadius: '8px',
                  border: `1px solid ${showSearch ? '#6366f1' : '#cbd5e1'}`,
                  background: showSearch ? '#e0e7ff' : '#f8fafc',
                  color: showSearch ? '#4338ca' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                title={showSearch ? 'Close search' : 'Search employee by name, Iqama, or title'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showSearch ? 'search_off' : 'search'}
                </span>
              </button>
            </div>

            {/* Quick Search Input */}
            {showSearch && (
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #6366f1',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6366f1' }}>
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Type employee name, Iqama number, or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.88rem',
                      color: '#0f172a'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  )}
                </div>

                {/* Instant Search Results Dropdown */}
                {searchQuery.trim() && (
                  <div
                    style={{
                      marginTop: '6px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      padding: '4px'
                    }}
                  >
                    {filteredEmployees.length === 0 ? (
                      <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
                        No employees found matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: emp.id === selectedEmployeeId ? '#eef2ff' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.84rem'
                          }}
                          onMouseEnter={(e) => {
                            if (emp.id !== selectedEmployeeId) e.currentTarget.style.background = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            if (emp.id !== selectedEmployeeId) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div>
                            <strong style={{ color: '#0f172a' }}>{emp.name}</strong>
                            <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.78rem' }}>
                              {emp.job_title || 'Staff'}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.78rem' }}>
                            {emp.iqama_number}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {currentSelectedEmp && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  <strong>Iqama:</strong> {currentSelectedEmp.iqama_number}
                </span>
                {currentSelectedEmp.job_title && (
                  <span>
                    <strong>Role / Title:</strong> {currentSelectedEmp.job_title}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Month & Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Salary Month (YYYY-MM) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Basic Salary */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Basic Salary (USD $) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontWeight: 600
                }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basicSalary}
                onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                required
                disabled={submitting}
                placeholder="3000.00"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 600
                }}
              />
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Net salary will initially equal basic salary. Additional deductions and advances can be configured in the slip editor.
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || employees.length === 0}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#4F5DFF',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: submitting || employees.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: submitting || employees.length === 0 ? 0.7 : 1
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {submitting ? 'sync' : 'payments'}
              </span>
              {submitting ? 'Generating...' : 'Generate Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
