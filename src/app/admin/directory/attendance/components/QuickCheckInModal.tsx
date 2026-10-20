'use client';

import { useEffect } from 'react';

interface QuickCheckInModalProps {
  isOpen: boolean;
  departments: any[];
  employees: any[];
  selectedDepartmentId: string;
  selectedEmployees: string[];
  onSelectDepartment: (deptId: string) => void;
  onToggleEmployee: (iqama: string, checked: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function QuickCheckInModal({
  isOpen,
  departments,
  employees,
  selectedDepartmentId,
  selectedEmployees,
  onSelectDepartment,
  onToggleEmployee,
  onCancel,
  onSubmit
}: QuickCheckInModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const departmentEmployees = employees.filter(e => e.department_id === selectedDepartmentId);

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
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>how_to_reg</span>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Quick Check-in</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
            Select Department
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => onSelectDepartment(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '14px'
            }}
          >
            <option value="">-- Select a Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {selectedDepartmentId && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
              Select Employees
            </label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
              {departmentEmployees.length > 0 ? (
                departmentEmployees.map((e) => (
                  <label key={e.iqama_number} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(e.iqama_number)}
                      onChange={(ev) => onToggleEmployee(e.iqama_number, ev.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.95rem', color: '#334155' }}>
                      {e.name} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({e.iqama_number})</span>
                    </span>
                  </label>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>No employees found in this department.</p>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={selectedEmployees.length === 0}
            style={{
              padding: '9px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: selectedEmployees.length === 0 ? 0.6 : 1
            }}
          >
            Submit Check-in
          </button>
        </div>
      </div>
    </div>
  );
}
