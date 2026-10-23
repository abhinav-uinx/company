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

  // Interactive toggle: switches between Authorized and Disabled
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

  const cleanId = decodeURIComponent(String(employeeId || '')).trim();
  const matchedDept = departments.find(d => d.id === departmentId);
  const deptName = matchedDept ? matchedDept.name : (employee?.department || '');
  const matchedRole = roles.find(r => r.id === roleId);
  const roleName = matchedRole ? matchedRole.role_name : (employee?.role || '');

  // Extract clean initials for executive avatar
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EM';

  // Determine if Iqama is a real national/residency ID vs raw machine UUID
  const rawIqama = String(iqama || employee?.iqama_number || '').trim();
  const isRealIqama = rawIqama && !rawIqama.includes('-') && rawIqama.length <= 15;
  const displayIqama = isRealIqama ? rawIqama : null;
  const displayEmpId = cleanId ? (cleanId.length > 12 ? `EMP-${cleanId.slice(0, 8).toUpperCase()}` : cleanId) : 'N/A';

  // Unified, cohesive enterprise module styling (no random rainbow colors)
  const getFolderTheme = (isFull: boolean, isViewOnly: boolean) => {
    if (isFull) {
      return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
    if (isViewOnly) {
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    }
    return { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' };
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .edit-page-container {
          max-width: 1200px;
          margin: 28px auto 60px;
          padding: 0 20px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 500;
          margin-bottom: 14px;
          padding: 6px 12px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          transition: all 0.15s ease;
        }
        .back-link:hover {
          color: #0f172a;
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Clean Enterprise Profile Header */
        .edit-hero {
          background: #ffffff;
          border-radius: 12px;
          padding: 22px 26px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .hero-profile-group {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hero-avatar {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .hero-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .hero-breadcrumb-slash {
          color: #cbd5e1;
        }

        .hero-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .hero-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hero-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #475569;
          font-weight: 500;
        }

        .hero-meta-chip strong {
          color: #0f172a;
          font-weight: 600;
        }

        .hero-stats-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero-kpi-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          font-weight: 600;
        }

        /* Section Card Container */
        .section-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 24px 28px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .section-title {
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }

        .policy-notice-banner {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #2563eb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.84rem;
          color: #475569;
          line-height: 1.45;
        }

        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 18px;
          margin-top: 15px;
        }

        /* Standard Folder Card with Subtle Accent Strip */
        .folder-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .folder-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          transition: all 0.2s ease;
        }
        .folder-card:hover {
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }

        /* Active Card: Clean Blue Outline & Top Accent */
        .folder-card.active-highlight {
          border: 1.5px solid #3b82f6 !important;
          background: #ffffff !important;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04) !important;
        }
        .folder-card.active-highlight::before {
          background: #2563eb;
        }

        /* View Only Card: Warm Amber Outline & Top Accent */
        .folder-card.view-highlight {
          border: 1.5px solid #f59e0b !important;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.08) !important;
        }
        .folder-card.view-highlight::before {
          background: #d97706;
        }

        /* Disabled folder card */
        .folder-card.disabled-folder {
          background: #fafafa;
          border-color: #e2e8f0;
          opacity: 0.72;
        }

        .preset-chip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-chip:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .preset-chip.chip-primary {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #2563eb;
          font-weight: 600;
        }
        .preset-chip.chip-primary:hover {
          background: #f0f7ff;
          border-color: #bfdbfe;
        }
        .preset-chip.chip-danger {
          color: #b91c1c;
          border-color: #e2e8f0;
        }
        .preset-chip.chip-danger:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
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

        {/* Executive Profile Header */}
        <div className="edit-hero">
          <div className="hero-profile-group">
            {/* Clean Monogram Avatar */}
            <div className="hero-avatar">
              <span>{initials}</span>
            </div>

            <div>
              <div className="hero-breadcrumb">
                <span>DIRECTORY</span>
                <span className="hero-breadcrumb-slash">/</span>
                <span>SECURITY &amp; ACCESS</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 className="hero-title">
                  {name || 'Employee Profile'}
                </h1>
              </div>

              {/* Badges Row */}
              <div className="hero-badges-row" style={{ marginTop: '10px' }}>
                {displayIqama ? (
                  <span className="hero-meta-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>badge</span>
                    Iqama: <strong>{displayIqama}</strong>
                  </span>
                ) : (
                  <span className="hero-meta-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>fingerprint</span>
                    ID: <strong>{displayEmpId}</strong>
                  </span>
                )}

                <span className="hero-meta-chip">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>shield_person</span>
                  System Role: <strong>{roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : 'Staff'}</strong>
                </span>

                {deptName && (
                  <span className="hero-meta-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>apartment</span>
                    Department: <strong>{deptName}</strong>
                  </span>
                )}

                {email && (
                  <span className="hero-meta-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>mail</span>
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right-Side Summary Card */}
          <div className="hero-stats-panel">
            <div className="hero-kpi-card">
              <div className="hero-kpi-label">Module Permissions</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{activeHighlightedCount}</strong>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>of {SYSTEM_FOLDERS.length} Granted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fef2f2' : '#fefce8',
            border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : '#fef08a'}`,
            color: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#854d0e',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
            fontSize: '0.88rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
            </span>
            {toast.message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div className="material-symbols-outlined" style={{ fontSize: '40px', animation: 'spin 1s linear infinite' }}>progress_activity</div>
            <p style={{ marginTop: '12px', fontWeight: 500, fontSize: '0.9rem' }}>Loading employee profile &amp; access permissions...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>

            {/* SECTION 1: EMPLOYEE PROFILE & DETAILS */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '22px' }}>person</span>
                    Employee Details &amp; Profile Information
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem' }}>
                    Personal records, contact numbers, department assignments, and permission level.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Iqama / National ID
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={iqama}
                    onChange={e => setIqama(e.target.value)}
                    placeholder="e.g. 2489102938"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    System Role
                  </label>
                  <div
                    style={{
                      padding: '11px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2563eb' }}>
                      shield_person
                    </span>
                    <span>{roles.find(r => r.id === roleId)?.role_name ? roles.find(r => r.id === roleId)!.role_name.charAt(0).toUpperCase() + roles.find(r => r.id === roleId)!.role_name.slice(1) : 'Staff'}</span>
                  </div>
                </div>
              </div>

              {/* Collapsible Password Reset Section */}
              {showPasswordSection && (
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a' }}>Change Employee Password</h4>
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
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Leave blank to preserve the employee&apos;s existing login credentials.
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 2: FOLDER ACCESS MATRIX */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '22px' }}>folder_shared</span>
                    Folder &amp; File Access Matrix
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem' }}>
                    Granular security privileges and folder authorization for MedEscort International records.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>Quick Presets:</span>
                  <button type="button" className="preset-chip chip-primary" onClick={() => handlePreset('all')}>Grant All</button>
                  <button type="button" className="preset-chip" onClick={() => handlePreset('nurse')}>Nurse Standard</button>
                  <button type="button" className="preset-chip" onClick={() => handlePreset('clinical')}>Clinical View-Only</button>
                  <button type="button" className="preset-chip chip-danger" onClick={() => handlePreset('none')}>Revoke All</button>
                </div>
              </div>

              {/* Policy Banner */}
              <div className="policy-notice-banner">
                <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '20px', flexShrink: 0 }}>verified_user</span>
                <div>
                  <strong style={{ color: '#0f172a' }}>Enterprise Access Governance:</strong> Enabled modules allow staff members to create, edit, and process records. View Only restricts actions to read-only audits. Disabled prevents access.
                </div>
              </div>

              {/* Grid of the 7 System Folders */}
              <div className="folder-grid">
                {SYSTEM_FOLDERS.map(folder => {
                  const access = folderAccess[folder.id] || { enabled: false, permission: 'disabled' };
                  const isOptionActive = access.enabled && access.permission === 'full';
                  const isAllowed = access.enabled && access.permission !== 'disabled';
                  const isViewOnly = access.enabled && access.permission === 'view_only';
                  const theme = getFolderTheme(isOptionActive, isViewOnly);

                  // Detect modification from baseline
                  const initial = initialFolderAccess[folder.id];
                  const isModified = initial && (initial.enabled !== access.enabled || initial.permission !== access.permission);

                  return (
                    <div
                      key={folder.id}
                      className={`folder-card ${isOptionActive ? 'active-highlight' : isViewOnly ? 'view-highlight' : ''} ${!isAllowed ? 'disabled-folder' : ''}`}
                    >
                      <div>
                        {/* Folder Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: theme.bg,
                              border: `1px solid ${theme.border}`,
                              color: theme.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '21px' }}>{folder.icon}</span>
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.94rem', color: isAllowed ? '#0f172a' : '#64748b', fontWeight: 600 }}>
                                {folder.name}
                              </h4>
                              <span style={{
                                fontSize: '0.68rem',
                                color: isAllowed ? theme.color : '#94a3b8',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                opacity: isAllowed ? 0.95 : 0.6
                              }}>
                                {folder.category}
                              </span>
                            </div>
                          </div>

                          {/* Checkbox Toggle Only - No Badges */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => handleToggleFolder(folder.id)}
                                title={isAllowed ? 'Click to disable access' : 'Click to enable access'}
                                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0', lineHeight: 1.45 }}>
                          {folder.description}
                        </p>
                      </div>

                      {/* Access Options Control */}
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                            Access Options:
                          </label>
                          <span style={{ fontSize: '0.76rem', color: isOptionActive ? '#2563eb' : isViewOnly ? '#b45309' : '#64748b', fontWeight: 600 }}>
                            {isOptionActive ? 'Highlighted Active' : isViewOnly ? 'View Only' : 'Disabled'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Option 1: ACTIVE */}
                          <button
                            type="button"
                            onClick={() => handleSetPermissionLevel(folder.id, 'full')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '0.8rem',
                              fontWeight: isOptionActive ? 700 : 500,
                              borderRadius: '7px',
                              border: isOptionActive ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                              background: isOptionActive ? '#2563eb' : '#ffffff',
                              color: isOptionActive ? '#ffffff' : '#334155',
                              boxShadow: isOptionActive ? '0 2px 6px rgba(37, 99, 235, 0.28)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              transition: 'all 0.16s ease'
                            }}
                          >
                            {isOptionActive && (
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                            )}
                            Active
                          </button>

                          {/* Option 2: VIEW ONLY */}
                          <button
                            type="button"
                            onClick={() => handleSetPermissionLevel(folder.id, 'view_only')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '0.8rem',
                              fontWeight: isViewOnly ? 700 : 500,
                              borderRadius: '7px',
                              border: isViewOnly ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                              background: isViewOnly ? '#fefce8' : '#ffffff',
                              color: isViewOnly ? '#92400e' : '#334155',
                              boxShadow: isViewOnly ? '0 1px 3px rgba(217, 119, 6, 0.15)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              transition: 'all 0.16s ease'
                            }}
                          >
                            {isViewOnly && (
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                            )}
                            View Only
                          </button>

                          {/* Option 3: DISABLED */}
                          <button
                            type="button"
                            onClick={() => handleSetPermissionLevel(folder.id, 'disabled')}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '0.8rem',
                              fontWeight: (!access.enabled || access.permission === 'disabled') ? 700 : 500,
                              borderRadius: '7px',
                              border: (!access.enabled || access.permission === 'disabled') ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                              background: (!access.enabled || access.permission === 'disabled') ? '#fef2f2' : '#ffffff',
                              color: (!access.enabled || access.permission === 'disabled') ? '#b91c1c' : '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              transition: 'all 0.16s ease'
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
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: STICKY ACTIONS BAR */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #e2e8f0',
              padding: '16px 24px',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
              position: 'sticky',
              bottom: '20px',
              zIndex: 90
            }}>
              <Link
                href="/admin/directory"
                style={{
                  color: '#475569',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Cancel &amp; Return
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
                  <strong style={{ color: '#0f172a' }}>{activeHighlightedCount}</strong> Active Highlighted &bull; <strong style={{ color: '#0f172a' }}>{allowedFoldersCount}</strong> of {SYSTEM_FOLDERS.length} Folders Authorized
                </span>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: '1px solid #1d4ed8',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
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
