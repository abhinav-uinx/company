'use client';

import React from 'react';
import Link from 'next/link';

interface UserTableRowProps {
  user: any;
  updateMsg: { id: string; text: string } | null;
  formatDepartment: (deptStr: string) => string;
  onUpdateStatus: (idOrIqama: string, status: string) => void;
  onAssignAsNurse: (idOrIqama: string, currentDept: string) => void;
  onDeleteUser: (idOrIqama: string) => void;
}

export default function UserTableRow({
  user,
  updateMsg,
  formatDepartment,
  onUpdateStatus,
  onAssignAsNurse,
  onDeleteUser
}: UserTableRowProps) {
  const userId = user.id || user.iqama_number;
  const isUpdated = updateMsg && (updateMsg.id === user.iqama_number || updateMsg.id === user.id);

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{user.name || 'N/A'}</strong>
          {isUpdated && (
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
              ✓ {updateMsg.text}
            </span>
          )}
        </div>
      </td>
      <td>
        <strong style={{ fontFamily: 'monospace' }}>{user.iqama_number}</strong>
        <br />
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email || '—'}</span>
      </td>
      <td>
        <span style={{
          background: '#f1f5f9',
          color: '#334155',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          {formatDepartment(user.departments?.name || user.department)}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <select
            defaultValue={user.status}
            onChange={(e) => onUpdateStatus(userId, e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="active">Full Access (View + Read)</option>
            <option value="view_only">View Only</option>
            <option value="disabled">Disabled</option>
          </select>
          <Link
            href={`/admin/directory/edit/${userId}`}
            style={{
              fontSize: '0.75rem',
              color: '#4F5DFF',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
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
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onAssignAsNurse(userId, user.department)}
            style={{
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              medical_services
            </span>
            Assign as Nurse
          </button>
          <Link
            href={`/admin/directory/edit/${userId}`}
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
            title="Edit Employee & Access Control"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            <span>Edit</span>
          </Link>
          <button
            type="button"
            onClick={() => onDeleteUser(userId)}
            style={{
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fecaca',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Delete User"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
