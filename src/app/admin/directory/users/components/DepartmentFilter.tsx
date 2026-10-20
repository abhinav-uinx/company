'use client';

import React from 'react';

interface DepartmentFilterProps {
  departments: string[];
  activeFilter: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (dept: string) => void;
}

export default function DepartmentFilter({
  departments,
  activeFilter,
  isOpen,
  onToggle,
  onSelect
}: DepartmentFilterProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          padding: '8px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
          fontWeight: 500,
          color: '#0B1220',
          fontSize: '0.9rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4F5DFF' }}>
          filter_list
        </span>
        <span>Department: <strong>{activeFilter}</strong></span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            padding: '16px',
            zIndex: 100,
            minWidth: '220px'
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0B1220', fontWeight: 600 }}>
            Filter by Department
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="radio"
                name="dept-filter"
                style={{ width: 'auto', cursor: 'pointer', accentColor: '#4F5DFF' }}
                checked={activeFilter === 'All'}
                onChange={() => onSelect('All')}
              />
              <span>All Departments</span>
            </label>
            {departments.map((dept) => (
              <label
                key={dept}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                <input
                  type="radio"
                  name="dept-filter"
                  style={{ width: 'auto', cursor: 'pointer', accentColor: '#4F5DFF' }}
                  checked={activeFilter === dept}
                  onChange={() => onSelect(dept)}
                />
                <span>{dept}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
