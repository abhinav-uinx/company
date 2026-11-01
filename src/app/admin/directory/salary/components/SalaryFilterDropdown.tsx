'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface MonthOption {
  value: string;
  label: string;
  short: string;
  count?: number;
}

interface SalaryFilterDropdownProps {
  departments: string[];
  selectedDepartments: string[];
  onToggleDepartment: (dept: string) => void;
  onSelectAllDepartments: () => void;

  months: MonthOption[];
  selectedMonths: string[];
  onToggleMonth: (monthValue: string) => void;
  onSelectAllMonths: () => void;

  years: string[];
  selectedYears: string[];
  onToggleYear: (year: string) => void;
  onSelectAllYears: () => void;

  onResetAll: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function SalaryFilterDropdown({
  departments,
  selectedDepartments,
  onToggleDepartment,
  onSelectAllDepartments,

  months,
  selectedMonths,
  onToggleMonth,
  onSelectAllMonths,

  years,
  selectedYears,
  onToggleYear,
  onSelectAllYears,

  onResetAll,
  filteredCount,
  totalCount
}: SalaryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalActive = selectedDepartments.length + selectedMonths.length + selectedYears.length;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .salary-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 600px) {
          .salary-filter-grid {
            grid-template-columns: 1fr;
            gap: 10px;
            max-height: 380px;
            overflow-y: auto;
          }
        }
      `}} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#fff',
          border: '1px solid #cbd5e1',
          height: '38px',
          padding: '0 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
          fontWeight: 600,
          color: '#334155',
          fontSize: '0.88rem',
          boxSizing: 'border-box',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.15s ease'
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '18px', color: '#64748b' }}
        >
          filter_list
        </span>
        <span>Filters</span>
        {totalActive > 0 && (
          <span
            style={{
              background: '#334155',
              color: '#fff',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              minWidth: '16px',
              textAlign: 'center'
            }}
          >
            {totalActive}
          </span>
        )}
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '18px', color: '#94a3b8' }}
        >
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
            padding: '16px',
            zIndex: 100,
            width: 'min(490px, calc(100vw - 32px))',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#475569' }}>
                tune
              </span>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                Filter Salary Records
              </h4>
            </div>

            {totalActive > 0 && (
              <button
                type="button"
                onClick={onResetAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
                Reset all
              </button>
            )}
          </div>

          {/* Three Columns Grid on Desktop, stacked on Mobile */}
          <div className="salary-filter-grid">
            {/* Column 1: Department */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  Department
                </span>
                {selectedDepartments.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: '#e2e8f0',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      fontWeight: 600
                    }}
                  >
                    {selectedDepartments.length}
                  </span>
                )}
              </div>

              {/* All Departments Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 6px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: '#334155',
                  background: selectedDepartments.length === 0 ? '#e2e8f0' : 'transparent',
                  fontWeight: selectedDepartments.length === 0 ? 600 : 400,
                  marginBottom: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDepartments.length === 0}
                  onChange={onSelectAllDepartments}
                  style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                />
                <span>All Departments</span>
              </label>

              {/* Department Checkboxes List */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {departments.map((dept) => {
                  const isChecked = selectedDepartments.includes(dept);
                  return (
                    <label
                      key={dept}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 6px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        color: '#334155',
                        background: isChecked ? '#e2e8f0' : 'transparent',
                        fontWeight: isChecked ? 600 : 400
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleDepartment(dept)}
                        style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dept}>
                        {dept}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Month */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  Month
                </span>
                {selectedMonths.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: '#e2e8f0',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      fontWeight: 600
                    }}
                  >
                    {selectedMonths.length}
                  </span>
                )}
              </div>

              {/* All Months Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 6px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: '#334155',
                  background: selectedMonths.length === 0 ? '#e2e8f0' : 'transparent',
                  fontWeight: selectedMonths.length === 0 ? 600 : 400,
                  marginBottom: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMonths.length === 0}
                  onChange={onSelectAllMonths}
                  style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                />
                <span>All Months</span>
              </label>

              {/* Month Checkboxes List */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {months.map((m) => {
                  const isChecked = selectedMonths.includes(m.value);
                  return (
                    <label
                      key={m.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 6px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        color: '#334155',
                        background: isChecked ? '#e2e8f0' : 'transparent',
                        fontWeight: isChecked ? 600 : 400
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleMonth(m.value)}
                        style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                      />
                      <span style={{ flex: 1 }}>{m.label}</span>
                      {m.count !== undefined && m.count > 0 && (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          ({m.count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Year */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  Year
                </span>
                {selectedYears.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: '#e2e8f0',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      fontWeight: 600
                    }}
                  >
                    {selectedYears.length}
                  </span>
                )}
              </div>

              {/* All Years Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 6px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: '#334155',
                  background: selectedYears.length === 0 ? '#e2e8f0' : 'transparent',
                  fontWeight: selectedYears.length === 0 ? 600 : 400,
                  marginBottom: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedYears.length === 0}
                  onChange={onSelectAllYears}
                  style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                />
                <span>All Years</span>
              </label>

              {/* Year Checkboxes List */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {years.map((year) => {
                  const isChecked = selectedYears.includes(year);
                  return (
                    <label
                      key={year}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 6px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        color: '#334155',
                        background: isChecked ? '#e2e8f0' : 'transparent',
                        fontWeight: isChecked ? 600 : 400
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleYear(year)}
                        style={{ accentColor: '#334155', width: '15px', height: '15px', cursor: 'pointer', margin: 0 }}
                      />
                      <span>{year}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> records
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
