'use client';

import React from 'react';
import Link from 'next/link';

interface UserTableRowProps {
  user: any;
  rolesList?: any[];
  updateMsg: { id: string; text: string } | null;
  formatDepartment: (deptStr: string) => string;
  onUpdateStatus: (idOrIqama: string, status: string) => void;
  onUpdateRole?: (idOrIqama: string, roleId: string) => void;
  onAssignAsNurse: (idOrIqama: string, currentDept: string, isCurrentlyNurse?: boolean) => void;
  onDeleteUser: (idOrIqama: string) => void;
}

export default function UserTableRow({
  user,
  rolesList = [],
  updateMsg,
  formatDepartment,
  onUpdateStatus,
  onUpdateRole,
  onAssignAsNurse,
  onDeleteUser
}: UserTableRowProps) {
  const userId = user.id || user.iqama_number;
  const isUpdated = updateMsg && (updateMsg.id === user.iqama_number || updateMsg.id === user.id);

  const deptDisplayName = formatDepartment(user.departments?.name || user.department);
  const isNurse = deptDisplayName.toLowerCase().includes('nurse') ||
    (typeof user.department === 'string' && (user.department.toLowerCase().includes('nurse') || user.department.includes('d69ccefc-045a-4bb1-8c27-99120e16610b'))) ||
    user.department_id === 'd69ccefc-045a-4bb1-8c27-99120e16610b';
  const isHR = deptDisplayName.toLowerCase().includes('hr') || deptDisplayName.toLowerCase().includes('human');
  const isOps = deptDisplayName.toLowerCase().includes('operation');

  const rawRoleName = (user.roles?.role_name || user.role || 'staff').toLowerCase();
  const isAdminRole = rawRoleName === 'admin' || rawRoleName.includes('admin');
  const roleDisplayName = isAdminRole ? 'Administrator' : 'Staff';

  return (
    <tr>
      {/* 1. Name & Job Title */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isAdminRole 
              ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
              : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.82rem',
            flexShrink: 0
          }}>
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'EM'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{user.name || 'N/A'}</strong>
              {isUpdated && (
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                  ✓ {updateMsg.text}
                </span>
              )}
            </div>
            {user.job_title ? (
              <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                {user.job_title}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                Staff Member
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 2. Iqama / Email */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#64748b' }}>badge</span>
          <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '0.88rem' }}>{user.iqama_number}</strong>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
          {user.email || '—'}
        </span>
      </td>

      {/* 3. Department */}
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: isNurse ? '#ecfdf5' : isOps ? '#f0f9ff' : isHR ? '#faf5ff' : '#f8fafc',
          color: isNurse ? '#059669' : isOps ? '#0284c7' : isHR ? '#7c3aed' : '#334155',
          border: `1px solid ${isNurse ? '#a7f3d0' : isOps ? '#bae6fd' : isHR ? '#e9d5ff' : '#e2e8f0'}`,
          padding: '0 10px',
          height: '28px',
          boxSizing: 'border-box',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          width: 'fit-content'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            {isNurse ? 'medical_services' : isOps ? 'flight_takeoff' : isHR ? 'groups' : 'apartment'}
          </span>
          {deptDisplayName}
        </span>
      </td>

      {/* 4. System Role (Fixed) */}
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: isAdminRole ? '#f5f3ff' : '#eff6ff',
          color: isAdminRole ? '#6d28d9' : '#1d4ed8',
          border: `1px solid ${isAdminRole ? '#ddd6fe' : '#bfdbfe'}`,
          padding: '0 10px',
          height: '28px',
          boxSizing: 'border-box',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          width: 'fit-content'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            {isAdminRole ? 'admin_panel_settings' : 'shield_person'}
          </span>
          {roleDisplayName}
        </span>
      </td>

      {/* 5. Permission Level */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' }}>
          <select
            defaultValue={user.status}
            onChange={(e) => onUpdateStatus(userId, e.target.value)}
            style={{
              height: '32px',
              width: '130px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}
          >
            <option value="active">Active</option>
            <option value="view_only">View Only</option>
            <option value="disabled">Disabled</option>
          </select>
          <Link
            href={`/admin/directory/edit/${userId}`}
            style={{
              fontSize: '0.75rem',
              color: '#2563eb',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              lineHeight: 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              folder_shared
            </span>
            {Array.isArray(user.permissions)
              ? `${user.permissions.length} Folders Authorized`
              : 'Customize Folders'}
          </Link>
        </div>
      </td>

      {/* 6. Actions */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href={`/admin/directory/edit/${userId}`}
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: 'none',
              height: '32px',
              padding: '0 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              boxSizing: 'border-box',
              transition: 'all 0.15s ease'
            }}
            title="Edit Employee & Access Control"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={() => onDeleteUser(userId)}
            style={{
              background: '#fef2f2',
              color: '#ef4444',
              border: 'none',
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease'
            }}
            title="Delete User"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>delete</span>
          </button>
          {!isNurse && (
            <button
              type="button"
              onClick={() => onAssignAsNurse(userId, user.department, false)}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: 'none',
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="Assign as Nurse"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0ea5e9' }}>
                medical_services
              </span>
              Assign as Nurse
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
