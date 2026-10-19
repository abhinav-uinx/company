'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import Header from '@/app/admin/dashboard/header';
import { SYSTEM_FOLDERS } from '@/app/admin/directory/constants';
import { notifyPermissionsChanged } from '@/lib/permissionsSync';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Employee details state
  const [employee, setEmployee] = useState<any>(null);
  const [name, setName] = useState('');
  const [iqama, setIqama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('active');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Departments & Roles lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Folder Access Permissions: map of folderId -> { enabled: boolean, permission: 'full' | 'view_only' | 'disabled' }
  const [folderAccess, setFolderAccess] = useState<Record<string, { enabled: boolean; permission: 'full' | 'view_only' | 'disabled' }>>({});
  const [initialFolderAccess, setInitialFolderAccess] = useState<Record<string, { enabled: boolean; permission: 'full' | 'view_only' | 'disabled' }>>({});

  // Message notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch departments and roles cleanly
      const [deptRes, rolesRes] = await Promise.all([
        supabaseAuth.from('departments').select('*').order('name'),
        supabaseAuth.from('roles').select('*').order('role_name')
      ]);

      const depts = deptRes.data || [];
      const roles = rolesRes.data || [];
      setDepartments(depts);
      setRoles(roles);

      // 2. Fetch employee record: prioritize id (UUID) first, then iqama_number/email
      const cleanId = decodeURIComponent(String(employeeId || '')).trim();
      let emp: any = null;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) {
        // Query by id (UUID)
        const { data: byId } = await supabaseAuth
          .from('employees')
          .select('*')
          .eq('id', cleanId);
        if (byId && byId.length > 0) {
          emp = byId[0];
        }
      }

      // Query by iqama_number if not found by id
      if (!emp) {
        const { data: byIqama } = await supabaseAuth
          .from('employees')
          .select('*')
          .eq('iqama_number', cleanId);
        if (byIqama && byIqama.length > 0) {
          emp = byIqama[0];
        }
      }

      // Query by email
      if (!emp) {
        const { data: byEmail } = await supabaseAuth
          .from('employees')
          .select('*')
          .eq('email', cleanId);
        if (byEmail && byEmail.length > 0) {
          emp = byEmail[0];
        }
      }

      // Fallback: search all employees in memory matching id or iqama_number
      if (!emp) {
        const { data: allEmps } = await supabaseAuth.from('employees').select('*');
        if (allEmps && allEmps.length > 0) {
          emp = allEmps.find((e: any) =>
            (e.id && String(e.id).toLowerCase() === cleanId.toLowerCase()) ||
            String(e.iqama_number || '').trim() === cleanId ||
            String(e.iqama_number || '').trim() === String(employeeId || '').trim() ||
            (e.email && e.email.toLowerCase().trim() === cleanId.toLowerCase()) ||
            (e.name && e.name.toLowerCase().trim() === cleanId.toLowerCase())
          ) || null;
        }
      }

      if (emp) {
        setEmployee(emp);
        setName(emp.name || '');
        setIqama(emp.iqama_number || '');
        setEmail(emp.email || '');
        setPhone(emp.phone_number || '');
        setJobTitle(emp.job_title || '');

        // Resolve matching Department dropdown value
        const matchedDept = depts.find((d: any) =>
          d.id === emp.department_id ||
          d.id === emp.department ||
          (d.name && emp.department && d.name.toLowerCase().trim() === emp.department.toLowerCase().trim())
        );
        setDepartmentId(matchedDept ? matchedDept.id : (emp.department_id || emp.department || ''));

        // Resolve matching Role dropdown value
        const matchedRole = roles.find((r: any) =>
          r.id === emp.role ||
          (r.role_name && emp.role && r.role_name.toLowerCase().trim() === emp.role.toLowerCase().trim())
        );
        setRoleId(matchedRole ? matchedRole.id : (emp.role || ''));

        setStatus(emp.status || 'active');

        // Check if employee_folder_permissions table has records for this employee
        let dbPerms: any[] | null = null;
        try {
          const { data: byEmpIqama } = await supabaseAuth
            .from('employee_folder_permissions')
            .select('*')
            .eq('employee_iqama', emp.iqama_number);
          if (byEmpIqama && byEmpIqama.length > 0) {
            dbPerms = byEmpIqama;
          }
        } catch (e) {
          // Optional table
        }

        // Initialize folder access map for the 7 system folders
        const initialMap: Record<string, { enabled: boolean; permission: 'full' | 'view_only' | 'disabled' }> = {};

        if (dbPerms && dbPerms.length > 0) {
          const row = dbPerms[0];
          // Check if horizontal schema row (one row per employee with folder columns)
          if (row.customers !== undefined || row.escorts !== undefined) {
            SYSTEM_FOLDERS.forEach(folder => {
              const val = row[folder.id];
              const isAllowed = val !== undefined && val !== null && val !== 'disabled';
              const permLevel = (val as any) || (isAllowed ? 'full' : 'disabled');
              initialMap[folder.id] = { enabled: isAllowed, permission: permLevel };
            });
          } else {
            // Fallback for vertical schema
            SYSTEM_FOLDERS.forEach(folder => {
              const match = dbPerms!.find((p: any) => p.folder_id === folder.id);
              if (match) {
                const isAllowed = match.is_enabled ?? (match.permission_level !== 'disabled');
                const permLevel = (match.permission_level as any) || (isAllowed ? 'full' : 'disabled');
                initialMap[folder.id] = { enabled: isAllowed, permission: permLevel };
              } else {
                initialMap[folder.id] = { enabled: false, permission: 'disabled' };
              }
            });
          }
        } else {
          // Parse existing permissions from employee record
          let rawPerms: any = emp.permissions;
          if (typeof rawPerms === 'string') {
            try { rawPerms = JSON.parse(rawPerms); } catch (e) { rawPerms = []; }
          }

          SYSTEM_FOLDERS.forEach(folder => {
            let isAllowed = false;
            let permLevel: 'full' | 'view_only' | 'disabled' = 'full';

            if (Array.isArray(rawPerms)) {
              isAllowed = rawPerms.includes(folder.id) ||
                (folder.id === 'customers' && rawPerms.includes('patients')) ||
                (folder.id === 'general_services' && (rawPerms.includes('documentation') || rawPerms.includes('general_services'))) ||
                (folder.id === 'forms' && (rawPerms.includes('forms') || rawPerms.includes('hub'))) ||
                (folder.id === 'reports' && (rawPerms.includes('reports') || rawPerms.includes('analytics'))) ||
                (folder.id === 'invoices' && (rawPerms.includes('invoices') || rawPerms.includes('billing')));
            } else if (rawPerms && typeof rawPerms === 'object') {
              if (rawPerms[folder.id]) {
                isAllowed = rawPerms[folder.id].enabled ?? true;
                permLevel = rawPerms[folder.id].permission || 'full';
              } else if (folder.id === 'general_services' && rawPerms['documentation']) {
                isAllowed = rawPerms['documentation'].enabled ?? true;
                permLevel = rawPerms['documentation'].permission || 'full';
              }
            } else {
              isAllowed = true;
            }

            initialMap[folder.id] = {
              enabled: isAllowed,
              permission: isAllowed ? permLevel : 'disabled'
            };
          });
        }

        setFolderAccess(initialMap);
        setInitialFolderAccess(JSON.parse(JSON.stringify(initialMap)));
      } else {
        showToast(`Employee record for identifier "${employeeId}" not found`, 'error');
      }
    } catch (err: any) {
      console.error('Error loading employee:', err);
      showToast('Failed to load employee details: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Interactive toggle: switches between Active (Full Access) and Disabled
  const handleToggleFolder = (folderId: string) => {
    setFolderAccess(prev => {
      const current = prev[folderId] || { enabled: false, permission: 'disabled' };
      const nextEnabled = !current.enabled;
      return {
        ...prev,
        [folderId]: {
          enabled: nextEnabled,
          permission: nextEnabled ? 'full' : 'disabled'
        }
      };
    });
  };

  // Interactive selection:
  // - Selecting 'full' makes it Active -> Highlighted
  // - Selecting 'view_only' or 'disabled' -> Active highlight is immediately removed
  const handleSetPermissionLevel = (folderId: string, level: 'full' | 'view_only' | 'disabled') => {
    setFolderAccess(prev => ({
      ...prev,
      [folderId]: {
        enabled: level !== 'disabled',
        permission: level
      }
    }));
  };

  const handlePreset = (preset: 'all' | 'none' | 'nurse' | 'clinical' | 'admin') => {
    const updated: Record<string, { enabled: boolean; permission: 'full' | 'view_only' | 'disabled' }> = {};

    SYSTEM_FOLDERS.forEach(folder => {
      if (preset === 'all' || preset === 'admin') {
        updated[folder.id] = { enabled: true, permission: 'full' };
      } else if (preset === 'none') {
        updated[folder.id] = { enabled: false, permission: 'disabled' };
      } else if (preset === 'nurse') {
        const nurseFolders = ['customers', 'escorts', 'general_services', 'forms'];
        const allowed = nurseFolders.includes(folder.id);
        updated[folder.id] = { enabled: allowed, permission: allowed ? 'full' : 'disabled' };
      } else if (preset === 'clinical') {
        const clinFolders = ['customers', 'general_services', 'vault', 'forms'];
        const allowed = clinFolders.includes(folder.id);
        updated[folder.id] = { enabled: allowed, permission: allowed ? 'view_only' : 'disabled' };
      }
    });

    setFolderAccess(updated);
    showToast(`Preset "${preset.toUpperCase()}" applied`, 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || name.trim() === '') {
      showToast('Please enter an employee name before saving.', 'warning');
      return;
    }

    setSaving(true);

    try {
      const enabledFolderIds = Object.keys(folderAccess).filter(id => folderAccess[id]?.enabled);
      // Include documentation alias if general_services is enabled
      if (enabledFolderIds.includes('general_services') && !enabledFolderIds.includes('documentation')) {
        enabledFolderIds.push('documentation');
      }

      const updatePayload: any = {
        name: name.trim(),
        email: email.trim() || null,
        phone_number: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        department_id: departmentId || null,
        department: departmentId || null,
        role: roleId || null,
        status: status,
        permissions: enabledFolderIds
      };

      if (newPassword && newPassword.trim() !== '') {
        updatePayload.password = newPassword.trim();
        updatePayload.must_change_password = false;
      }

      const targetIqama = String(employee?.iqama_number || iqama || employeeId || '').trim();
      const targetId = employee?.id || null;

      let updateRes: any = null;
      if (targetId) {
        updateRes = await supabaseAuth
          .from('employees')
          .update(updatePayload)
          .eq('id', targetId);
      } else {
        updateRes = await supabaseAuth
          .from('employees')
          .update(updatePayload)
          .eq('iqama_number', targetIqama);
      }

      if (updateRes && updateRes.error) {
        throw updateRes.error;
      }

      // Upsert into employee_folder_permissions table: HORIZONTALLY (ONE ROW PER EMPLOYEE)
      try {
        const horizontalRow: Record<string, any> = {
          employee_iqama: targetIqama,
          customers: folderAccess['customers']?.enabled ? (folderAccess['customers']?.permission || 'full') : 'disabled',
          escorts: folderAccess['escorts']?.enabled ? (folderAccess['escorts']?.permission || 'full') : 'disabled',
          general_services: folderAccess['general_services']?.enabled ? (folderAccess['general_services']?.permission || 'full') : 'disabled',
          invoices: folderAccess['invoices']?.enabled ? (folderAccess['invoices']?.permission || 'full') : 'disabled',
          vault: folderAccess['vault']?.enabled ? (folderAccess['vault']?.permission || 'full') : 'disabled',
          reports: folderAccess['reports']?.enabled ? (folderAccess['reports']?.permission || 'full') : 'disabled',
          forms: folderAccess['forms']?.enabled ? (folderAccess['forms']?.permission || 'full') : 'disabled',
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await supabaseAuth
          .from('employee_folder_permissions')
          .upsert(horizontalRow, { onConflict: 'employee_iqama' });

        if (upsertErr) {
          console.error('Error upserting employee_folder_permissions:', upsertErr);
        }
      } catch (tableErr) {
        console.error('Table error:', tableErr);
      }

      // Broadcast instant multi-tier real-time update to all open tabs and windows (zero refresh)
      notifyPermissionsChanged(targetIqama);

      setInitialFolderAccess(JSON.parse(JSON.stringify(folderAccess)));
      showToast('Employee profile & folder access controls saved successfully! Returning to directory...', 'success');
      setNewPassword('');

      setTimeout(() => {
        router.push('/admin/directory');
      }, 700);
    } catch (err: any) {
      console.error('Error saving employee:', err);
      showToast('Error saving changes: ' + (err.message || 'Unknown error'), 'error');
      setSaving(false);
    }
  };

  const allowedFoldersCount = Object.values(folderAccess).filter(f => f.enabled).length;
  const activeHighlightedCount = Object.values(folderAccess).filter(f => f.enabled && f.permission === 'full').length;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .edit-page-container {
          max-width: 1200px;
          margin: 30px auto 60px;
          padding: 0 20px;
        }

        .edit-hero {
          background: linear-gradient(135deg, #0B1220 0%, #1a2744 100%);
          border-radius: 16px;
          padding: 24px 30px;
          color: #fff;
          margin-bottom: 25px;
          box-shadow: 0 10px 25px -5px rgba(11, 18, 32, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #93c5fd;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          margin-bottom: 12px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #bfdbfe;
        }

        /* Section Card Container */
        .section-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 24px 28px;
          margin-bottom: 25px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .section-title {
          font-size: 1.15rem;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }

        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }

        /* Standard Folder Card */
        .folder-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .folder-card:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.07);
          border-color: #cbd5e1;
        }

        /* ACTIVE OPTION HIGHLIGHT:
           When the selected option is Active (Full Access), highlight prominently with vibrant border and glow */
        .folder-card.active-highlight {
          border: 2px solid #4F5DFF !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(79, 93, 255, 0.16), 0 12px 28px -4px rgba(79, 93, 255, 0.18) !important;
          transform: translateY(-2px);
        }

        /* Non-active or disabled folder card: highlight is removed */
        .folder-card.disabled-folder {
          background: #f8fafc;
          border-color: #f1f5f9;
          box-shadow: none;
          transform: none;
        }

        .active-highlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.15);
        }

        .active-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 6px #2563eb;
          animation: pulseDot 1.8s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .changed-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fffbeb;
          color: #b45309;
          border: 1px dashed #f59e0b;
          padding: 2px 7px;
          border-radius: 10px;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .preview-btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .preview-btn.active {
          background: #4F5DFF;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(79, 93, 255, 0.25);
          cursor: pointer;
        }
        .preview-btn.active:hover {
          background: #3C46D6;
        }

        /* User requested custom disabled button styling with red cross cursor */
        .preview-btn.disabled-btn {
          background: #f1f5f9 !important;
          color: #94a3b8 !important;
          border: 1px dashed #cbd5e1 !important;
          opacity: 0.42 !important;
          filter: grayscale(45%) !important;
          cursor: not-allowed !important;
        }
        .preview-btn.disabled-btn:hover {
          opacity: 0.6 !important;
          border-color: #fca5a5 !important;
          background: #fef2f2 !important;
        }

        .red-cross-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ef4444;
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
          line-height: 1;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-active { background: #dcfce7; color: #15803d; }
        .status-view_only { background: #fef9c3; color: #a16207; }
        .status-disabled { background: #fee2e2; color: #b91c1c; }

        .preset-chip {
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-chip:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: #4F5DFF;
          box-shadow: 0 0 0 3px rgba(79, 93, 255, 0.15);
        }
      `}} />

      <Header />

      <main className="edit-page-container">
        {/* Breadcrumb / Top Bar */}
        <div>
          <Link href="/admin/directory" className="back-link">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Employee Directory &amp; Records
          </Link>
        </div>

        {/* Hero Header */}
        <div className="edit-hero">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#60a5fa' }}>manage_accounts</span>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                {name ? `Edit Employee: ${name}` : 'Edit Employee & Access Control'}
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
              Iqama Number: <strong style={{ color: '#fff' }}>{employeeId}</strong> &bull; Configure staff profile details and folder authorization.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className={`status-badge status-${status}`}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
              {status === 'active' ? 'Active' : status === 'view_only' ? 'View Only' : 'Disabled'}
            </span>

            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Highlighted</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
                {activeHighlightedCount} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>/ {SYSTEM_FOLDERS.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fef2f2' : '#fefce8',
            border: `1px solid ${toast.type === 'success' ? '#86efac' : toast.type === 'error' ? '#fca5a5' : '#fde047'}`,
            color: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#a16207',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in'
          }}>
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
            </span>
            {toast.message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>progress_activity</div>
            <p style={{ marginTop: '15px', fontWeight: 600 }}>Loading employee &amp; access controls...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>

            {/* SECTION 1: EMPLOYEE PROFILE & DETAILS (VISIBLE IMMEDIATELY, NO TABS) */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span className="material-symbols-outlined" style={{ color: '#4F5DFF' }}>person</span>
                    Employee Details &amp; Profile Information
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Personal records, contact numbers, department assignments, and permission level.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock_reset</span>
                  {showPasswordSection ? 'Hide Password Options' : 'Reset Password'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Alan Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Iqama / Unique ID
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    disabled
                    value={iqama}
                    style={{ background: '#f8fafc', color: '#64748b', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="employee@medescortinternational.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +966 50 123 4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Flight Nurse, Paramedic"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Department
                  </label>
                  <select
                    className="form-input"
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                  >
                    <option value="">No Department Assigned</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    System Role
                  </label>
                  <select
                    className="form-input"
                    value={roleId}
                    onChange={e => setRoleId(e.target.value)}
                  >
                    <option value="">No Role Assigned</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.role_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Account Status
                  </label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="view_only">View Only (Read Only)</option>
                    <option value="disabled">Disabled (Prohibited)</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Password Reset Section */}
              {showPasswordSection && (
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: '#0f172a' }}>Change Employee Password</h4>
                  <div style={{ position: 'relative', maxWidth: '380px' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Leave blank to preserve the employee&apos;s existing login credentials.
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 2: INTERACTIVE FOLDER ACCESS MATRIX (THE 7 SPECIFIED FOLDERS) */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span className="material-symbols-outlined" style={{ color: '#4F5DFF' }}>folder_shared</span>
                    Folder &amp; File Access Matrix
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Selecting <strong>Active</strong> highlights the folder. Selecting <strong>View Only</strong> or <strong>Disabled</strong> removes the highlight.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Quick Presets:</span>
                  <button type="button" className="preset-chip" onClick={() => handlePreset('all')}>All Active (Highlight)</button>
                  <button type="button" className="preset-chip" onClick={() => handlePreset('nurse')}>Nurse Default</button>
                  <button type="button" className="preset-chip" onClick={() => handlePreset('clinical')}>Clinical Only</button>
                  <button type="button" className="preset-chip" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handlePreset('none')}>Disable All (Remove Highlight)</button>
                </div>
              </div>

              {/* Info banner */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1e3a8a' }}>
                <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '20px' }}>info</span>
                <span>
                  <strong>Interactive Highlighting Policy:</strong> Active option selection illuminates the folder with a vibrant highlight border and glowing shadow. When set to <strong>Disabled</strong>, the button becomes dim and hovering displays a <strong>round red cross cursor</strong>.
                </span>
              </div>

              {/* Grid of the 7 System Folders */}
              <div className="folder-grid">
                {SYSTEM_FOLDERS.map(folder => {
                  const access = folderAccess[folder.id] || { enabled: false, permission: 'disabled' };
                  const isOptionActive = access.enabled && access.permission === 'full';
                  const isAllowed = access.enabled && access.permission !== 'disabled';

                  // Detect modification from baseline
                  const initial = initialFolderAccess[folder.id];
                  const isModified = initial && (initial.enabled !== access.enabled || initial.permission !== access.permission);

                  return (
                    <div
                      key={folder.id}
                      className={`folder-card ${isOptionActive ? 'active-highlight' : ''} ${!isAllowed ? 'disabled-folder' : ''}`}
                    >
                      <div>
                        {/* Folder Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: isOptionActive ? '#eff6ff' : isAllowed ? '#fefce8' : '#f1f5f9',
                              color: isOptionActive ? '#2563eb' : isAllowed ? '#ca8a04' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{folder.icon}</span>
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', color: isAllowed ? '#0f172a' : '#64748b' }}>
                                {folder.name}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                                {folder.category}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge & Toggle */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isOptionActive ? (
                              <span className="active-highlight-badge" title="Active Option Selected (Highlighted)">
                                <span className="active-dot"></span>
                                Active
                              </span>
                            ) : isModified ? (
                              <span className="changed-indicator" title="Changed from initial state (Highlight removed)">
                                Changed
                              </span>
                            ) : null}

                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', marginLeft: '4px' }}>
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => handleToggleFolder(folder.id)}
                                title={isAllowed ? 'Click to disable access' : 'Click to enable access'}
                                style={{ width: '18px', height: '18px', accentColor: '#4F5DFF', cursor: 'pointer' }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px 0', minHeight: '36px', lineHeight: 1.4 }}>
                          {folder.description}
                        </p>

                        {/* Interactive Options: Active highlights; any changes remove highlight */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                              Access Options:
                            </label>
                            <span style={{ fontSize: '0.72rem', color: isOptionActive ? '#2563eb' : '#64748b', fontWeight: 600 }}>
                              {isOptionActive ? 'Highlighted Active' : access.permission === 'view_only' ? 'View Only (No Highlight)' : 'Disabled'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {/* Option 1: ACTIVE (Full Access) -> HIGHLIGHTED */}
                            <button
                              type="button"
                              onClick={() => handleSetPermissionLevel(folder.id, 'full')}
                              style={{
                                flex: 1,
                                padding: '7px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: isOptionActive ? '2px solid #4F5DFF' : '1px solid #e2e8f0',
                                background: isOptionActive ? '#4F5DFF' : '#fff',
                                color: isOptionActive ? '#ffffff' : '#475569',
                                boxShadow: isOptionActive ? '0 2px 8px rgba(79, 93, 255, 0.35)' : 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              {isOptionActive && (
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                              )}
                              Active
                            </button>

                            {/* Option 2: VIEW ONLY -> REMOVES HIGHLIGHT */}
                            <button
                              type="button"
                              onClick={() => handleSetPermissionLevel(folder.id, 'view_only')}
                              style={{
                                flex: 1,
                                padding: '7px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: (access.permission === 'view_only' && access.enabled) ? '2px solid #ca8a04' : '1px solid #e2e8f0',
                                background: (access.permission === 'view_only' && access.enabled) ? '#fefce8' : '#fff',
                                color: (access.permission === 'view_only' && access.enabled) ? '#854d0e' : '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              {(access.permission === 'view_only' && access.enabled) && (
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                              )}
                              View Only
                            </button>

                            {/* Option 3: DISABLED -> REMOVES HIGHLIGHT & ACTIVATES DIM/RED CROSS */}
                            <button
                              type="button"
                              onClick={() => handleSetPermissionLevel(folder.id, 'disabled')}
                              style={{
                                flex: 1,
                                padding: '7px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: (!access.enabled || access.permission === 'disabled') ? '2px solid #dc2626' : '1px solid #e2e8f0',
                                background: (!access.enabled || access.permission === 'disabled') ? '#fef2f2' : '#fff',
                                color: (!access.enabled || access.permission === 'disabled') ? '#b91c1c' : '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              {(!access.enabled || access.permission === 'disabled') && (
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                              )}
                              Disabled
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Live Button Preview (Requirement: Dim button with red round cross cursor when disabled) */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                            Live Button Preview
                          </span>
                          {!isAllowed ? (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span className="red-cross-indicator">✕</span>
                              Access Prohibited
                            </span>
                          ) : isOptionActive ? (
                            <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                              Fully Active
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#ca8a04', fontWeight: 600 }}>
                              View Only
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`preview-btn ${isAllowed ? 'active' : 'disabled-btn'}`}
                          onClick={() => {
                            if (!isAllowed) {
                              showToast(`Access Prohibited: "${folder.name}" access is disabled for this account.`, 'warning');
                            } else {
                              showToast(`Access Granted: ${folder.name} is accessible.`, 'success');
                            }
                          }}
                          title={isAllowed ? `Allowed: ${folder.actionLabel}` : `Prohibited: Access to ${folder.name} is disabled`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {isAllowed ? 'folder_open' : 'block'}
                          </span>
                          <span>{folder.actionLabel}</span>
                          {!isAllowed && (
                            <span className="red-cross-indicator" style={{ marginLeft: 'auto' }}>✕</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: STICKY ACTIONS BAR */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              padding: '18px 24px',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              position: 'sticky',
              bottom: '20px',
              zIndex: 90
            }}>
              <Link
                href="/admin/directory"
                style={{
                  color: '#64748b',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Cancel &amp; Return
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                  <strong>{activeHighlightedCount}</strong> Active Highlighted &bull; <strong>{allowedFoldersCount}</strong> of {SYSTEM_FOLDERS.length} Folders Authorized
                </span>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#4F5DFF',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(79, 93, 255, 0.35)',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <span className="material-symbols-outlined">save</span>
                  {saving ? 'Saving Changes...' : 'Save Employee & Access Control'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
