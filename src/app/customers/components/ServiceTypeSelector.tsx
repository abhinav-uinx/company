'use client';

import React from 'react';

interface ServiceTypeSelectorProps {
  services: any[];
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  error?: string;
}

export default function ServiceTypeSelector({
  services,
  selectedServiceIds,
  onChange,
  error
}: ServiceTypeSelectorProps) {
  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      onChange(selectedServiceIds.filter(sId => sId !== id));
    } else {
      onChange([...selectedServiceIds, id]);
    }
  };

  return (
    <div style={{ width: '100%', gridColumn: '1 / -1', marginTop: '4px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Service Types *</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
            (Select one or both services)
          </span>
        </label>
        <span style={{ fontSize: '12px', fontWeight: 600, color: selectedServiceIds.length > 0 ? '#16a34a' : '#ef4444' }}>
          {selectedServiceIds.length} of {services.length} Selected
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}
      >
        {services.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          const isMedical = service.name?.toLowerCase().includes('medical');

          const accentColor = isMedical ? '#4f46e5' : '#0284c7';
          const bgActive = isMedical ? '#f5f3ff' : '#f0f9ff';
          const borderActive = isMedical ? '#818cf8' : '#38bdf8';
          const iconName = isMedical ? 'medical_services' : 'folder_shared';
          const description = isMedical
            ? 'Air & ground medical transport, doctor/nurse accompanying escort missions'
            : 'Visa processing, general documentation, embassy legalizations & translations';

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              style={{
                border: `2px solid ${isSelected ? borderActive : '#e2e8f0'}`,
                background: isSelected ? bgActive : '#ffffff',
                borderRadius: '12px',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                position: 'relative',
                boxShadow: isSelected ? `0 4px 14px -2px ${accentColor}25` : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.18s ease-in-out',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              {/* Checkbox box */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: `2px solid ${isSelected ? accentColor : '#cbd5e1'}`,
                  background: isSelected ? accentColor : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginTop: '2px',
                  flexShrink: 0,
                  transition: 'all 0.15s'
                }}
              >
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', fontWeight: 'bold' }}>
                    check
                  </span>
                )}
              </div>

              {/* Service details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '20px', color: isSelected ? accentColor : '#64748b' }}
                  >
                    {iconName}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#0f172a' : '#334155' }}>
                    {service.name}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: accentColor,
                        background: '#ffffff',
                        border: `1px solid ${borderActive}`,
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.45' }}>
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 500, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
