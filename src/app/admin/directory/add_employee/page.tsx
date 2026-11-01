'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { notifyPermissionsChanged } from '@/lib/permissionsSync';

interface ModuleOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SYSTEM_MODULES: ModuleOption[] = [
  {
    id: 'customers',
    name: 'Customer Management',
    icon: 'groups',
    description: 'Profiles, customer records & contacts'
  },
  {
    id: 'escorts',
    name: 'Escort Missions',
    icon: 'flight_takeoff',
    description: 'Flight operations, medical missions & dispatch'
  },
  {
    id: 'general_services',
    name: 'General Services',
    icon: 'medical_services',
    description: 'Service requests, attestations & translation'
  },
  {
    id: 'invoices',
    name: 'Invoice & Billing',
    icon: 'receipt_long',
    description: 'Billing statements, receipts & transactions'
  },
  {
    id: 'vault',
    name: 'Document Vault',
    icon: 'folder_zip',
    description: 'Secure passport archive & customer records'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: 'bar_chart',
    description: 'Operational analytics, logs & exports'
  },
  {
    id: 'forms',
    name: 'Document Hub / Forms',
    icon: 'assignment',
    description: 'Standard operational intake & consent forms'
  }
];

export default function AddEmployee(props: any) {
  const embedded = props?.embedded ?? false;
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [iqama, setIqama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [deptId, setDeptId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('active');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Selected Modules (default to all modules for easy onboarding)
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'customers',
    'escorts',
    'general_services',
    'invoices',
    'vault',
    'reports',
    'forms'
  ]);

  // Options from DB
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // UI status
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    employeeName?: string;
    employeeIqama?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [deptRes, rolesRes] = await Promise.all([
          supabaseAuth.from('departments').select('*').order('name'),
          supabaseAuth.from('roles').select('*').order('role_name')
        ]);

        if (isMounted) {
          if (deptRes.data) setDepartments(deptRes.data);
          if (rolesRes.data) {
            setRoles(rolesRes.data);
            const staffRole = rolesRes.data.find(
              (r: any) => (r.role_name || '').toLowerCase() === 'staff'
            ) || rolesRes.data[0];
            if (staffRole) setRoleId(staffRole.id);
          }
        }
      } catch (err) {
        console.error('Error fetching initial department/roles data:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick Password Generator
  const handleGeneratePassword = () => {
    const numbers = '23456789';
    const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const symbols = '!@#$%&*';
    
    let generated = 'Med@';
    for (let i = 0; i < 4; i++) {
      generated += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 2; i++) {
      generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    generated += symbols.charAt(Math.floor(Math.random() * symbols.length));

    setPassword(generated);
    setShowPassword(true);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(generated).then(() => {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2500);
      }).catch(() => {});
    }
  };

  const handleCopyPassword = () => {
    if (!password) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(password).then(() => {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2500);
      }).catch(() => {});
    }
  };

  // Module toggle helpers
  const handleToggleModule = (modId: string) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  const handleSelectAllModules = () => {
    setSelectedModules(SYSTEM_MODULES.map(m => m.id));
  };

  const handleClearAllModules = () => {
    setSelectedModules([]);
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setIqama('');
    setEmail('');
    setPhone('');
    setJobTitle('');
    setDeptId('');
    setPassword('');
    setShowPassword(false);
    setStatus('active');
    setSelectedModules(SYSTEM_MODULES.map(m => m.id));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent, redirectAfterSave: boolean) => {
    e.preventDefault();
    setNotification(null);

    const cleanName = name.trim();
    const cleanIqama = iqama.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanIqama || !cleanEmail || !cleanPassword) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields (Name, Iqama Number, Email, and Temporary Password).'
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Insert new employee record
      const { data: insertedData, error: empError } = await supabaseAuth
        .from('employees')
        .insert([
          {
            name: cleanName,
            iqama_number: cleanIqama,
            email: cleanEmail,
            phone_number: phone.trim() || null,
            job_title: jobTitle.trim() || null,
            department_id: deptId || null,
            department: deptId || null,
            role: roleId || null,
            status: status,
            password: cleanPassword,
            must_change_password: true,
            permissions: selectedModules
          }
        ])
        .select();

      if (empError) {
        throw new Error(empError.message || 'Could not insert employee');
      }

      // 2. Upsert horizontal permissions in employee_folder_permissions
      try {
        const horizontalRow: Record<string, any> = {
          employee_iqama: cleanIqama,
          customers: selectedModules.includes('customers') ? 'full' : 'disabled',
          escorts: selectedModules.includes('escorts') ? 'full' : 'disabled',
          general_services: selectedModules.includes('general_services') ? 'full' : 'disabled',
          invoices: selectedModules.includes('invoices') ? 'full' : 'disabled',
          vault: selectedModules.includes('vault') ? 'full' : 'disabled',
          reports: selectedModules.includes('reports') ? 'full' : 'disabled',
          forms: selectedModules.includes('forms') ? 'full' : 'disabled',
          updated_at: new Date().toISOString()
        };

        await supabaseAuth
          .from('employee_folder_permissions')
          .upsert(horizontalRow, { onConflict: 'employee_iqama' });

        // Trigger real-time permission sync across tabs
        notifyPermissionsChanged(cleanIqama);
      } catch (folderErr) {
        console.warn('Folder permissions row sync notice:', folderErr);
      }

      setNotification({
        type: 'success',
        message: `Employee "${cleanName}" was created successfully!`,
        employeeName: cleanName,
        employeeIqama: cleanIqama
      });

      if (redirectAfterSave) {
        setTimeout(() => {
          router.push('/admin/directory?tab=users');
        }, 1200);
      } else {
        resetForm();
      }
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setNotification({
        type: 'error',
        message: err.message || 'An unexpected error occurred while saving the employee.'
      });
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .add-emp-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          padding: 28px;
        }
        .add-emp-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .add-emp-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .add-emp-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .add-emp-input-wrapper {
          position: relative;
          width: 100%;
        }
        .add-emp-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: #94a3b8;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .add-emp-input, .add-emp-select {
          height: 40px;
          padding: 0 12px;
          font-size: 0.88rem;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
          width: 100%;
        }
        .add-emp-input.has-icon, .add-emp-select.has-icon {
          padding-left: 38px !important;
        }
        .add-emp-input:focus, .add-emp-select:focus {
          border-color: #334155;
          box-shadow: 0 0 0 3px rgba(51, 65, 85, 0.08);
        }
        .add-emp-select {
          cursor: pointer;
        }
        .add-emp-section-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 24px 0;
        }
        .add-emp-module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .add-emp-module-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }
        .add-emp-module-card:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .add-emp-module-card.selected {
          border-color: #94a3b8;
          background: #f8fafc;
        }
        @media (max-width: 768px) {
          .add-emp-card {
            padding: 18px !important;
          }
          .add-emp-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .add-emp-module-grid {
            grid-template-columns: 1fr !important;
          }
          .add-emp-footer-actions {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
          }
          .add-emp-footer-actions button,
          .add-emp-footer-actions a {
            text-align: center;
            justify-content: center;
          }
        }
      `}} />

      {/* Top Header when not embedded */}
      {!embedded && (
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/admin/directory"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '10px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            Back to Directory
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#0f172a' }}>
                  person_add
                </span>
                <h1 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                  Add New Employee
                </h1>
              </div>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                Fill in the details below to register an employee and configure system access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header when embedded in tabs */}
      {embedded && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#0f172a' }}>
              person_add
            </span>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
              New Employee Registration
            </h2>
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.86rem' }}>
            Enter personal details, assign role &amp; department, and select authorized modules.
          </p>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: notification.type === 'success' ? '#f8fafc' : '#fef2f2',
            border: notification.type === 'success' ? '1px solid #cbd5e1' : '1px solid #fecaca',
            color: notification.type === 'success' ? '#1e293b' : '#991b1b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                color: notification.type === 'success' ? '#166534' : '#dc2626'
              }}
            >
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                {notification.message}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' && (
              <Link
                href="/admin/directory?tab=users"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                View in Directory
              </Link>
            )}
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Dismiss"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={(e) => handleSubmit(e, true)} className="add-emp-card">
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#475569' }}>
              person_pin
            </span>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
              Employee Details
            </h3>
          </div>

          <div className="add-emp-grid-2">
            {/* Full Name */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  person
                </span>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  person
                </span>
                <input
                  type="text"
                  required
                  className="add-emp-input has-icon"
                  placeholder="e.g. Dr. Ahmed Al-Mansoor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Iqama / Unique ID */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  badge
                </span>
                Iqama Number / Civil ID <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  badge
                </span>
                <input
                  type="text"
                  required
                  className="add-emp-input has-icon"
                  placeholder="e.g. 2489102934"
                  value={iqama}
                  onChange={(e) => setIqama(e.target.value)}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  mail
                </span>
                Work Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  mail
                </span>
                <input
                  type="email"
                  required
                  className="add-emp-input has-icon"
                  placeholder="employee@medescortinternational.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  call
                </span>
                Phone Number <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  call
                </span>
                <input
                  type="tel"
                  className="add-emp-input has-icon"
                  placeholder="+966 5X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Job Title */}
            <div className="add-emp-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  work
                </span>
                Job Title / Designation <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  work
                </span>
                <input
                  type="text"
                  className="add-emp-input has-icon"
                  placeholder="e.g. Senior Medical Escort Nurse / Operations Coordinator"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="add-emp-section-divider" />

        {/* Section 2: Department, Role & Security */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#475569' }}>
              domain_verification
            </span>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
              Organization &amp; Credentials
            </h3>
          </div>

          <div className="add-emp-grid-2">
            {/* Department */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  corporate_fare
                </span>
                Department
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  corporate_fare
                </span>
                <select
                  className="add-emp-select has-icon"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                >
                  <option value="">No Department Assigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* System Role */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  shield_person
                </span>
                System Role
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  shield_person
                </span>
                <select
                  className="add-emp-select has-icon"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.role_name || r.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Staff</option>
                  )}
                </select>
              </div>
            </div>

            {/* Account Status */}
            <div className="add-emp-form-group">
              <label className="add-emp-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                  verified_user
                </span>
                Account Status
              </label>
              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  verified_user
                </span>
                <select
                  className="add-emp-select has-icon"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="view_only">View Only (Read-Only)</option>
                  <option value="disabled">Disabled (Suspended)</option>
                </select>
              </div>
            </div>

            {/* Initial Password with Quick Generator */}
            <div className="add-emp-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="add-emp-label">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748b' }}>
                    lock
                  </span>
                  Temporary Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 2px',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Generate a random secure temporary password"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    auto_awesome
                  </span>
                  Generate Password
                </button>
              </div>

              <div className="add-emp-input-wrapper">
                <span className="material-symbols-outlined add-emp-input-icon">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="add-emp-input has-icon"
                  style={{ paddingRight: '72px' }}
                  placeholder="Set initial password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    zIndex: 2
                  }}
                >
                  {password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedPassword ? '#16a34a' : '#64748b',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={copiedPassword ? 'Copied!' : 'Copy password'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                        {copiedPassword ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>
                  info
                </span>
                Employee must change this temporary password upon first login.
              </span>
            </div>
          </div>
        </div>

        <div className="add-emp-section-divider" />

        {/* Section 3: Module Permissions */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#475569' }}>
                security
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                  System Module Access
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}
              >
                {selectedModules.length} of {SYSTEM_MODULES.length} enabled
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAllModules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  done_all
                </span>
                Select All
              </button>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <button
                type="button"
                onClick={handleClearAllModules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  remove_done
                </span>
                Clear All
              </button>
            </div>
          </div>

          <div className="add-emp-module-grid">
            {SYSTEM_MODULES.map((mod) => {
              const isChecked = selectedModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => handleToggleModule(mod.id)}
                  className={`add-emp-module-card ${isChecked ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent click
                    style={{
                      accentColor: '#334155',
                      width: '16px',
                      height: '16px',
                      marginTop: '2px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '16px', color: isChecked ? '#334155' : '#94a3b8' }}
                      >
                        {mod.icon}
                      </span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isChecked ? '#0f172a' : '#475569',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {mod.name}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.74rem',
                        color: '#64748b',
                        lineHeight: 1.3
                      }}
                    >
                      {mod.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="add-emp-section-divider" />

        {/* Footer Actions */}
        <div
          className="add-emp-footer-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <Link
            href="/admin/directory"
            style={{
              padding: '9px 16px',
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              borderRadius: '6px',
              border: '1px solid transparent',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
            Cancel
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, false)}
              style={{
                background: '#fff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add_circle
              </span>
              Save &amp; Add Another
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '9px 22px',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                how_to_reg
              </span>
              {saving ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  if (embedded) return formContent;

  return (
    <>
      <AdminHeader />
      <main
        style={{
          padding: '30px 20px 60px 20px',
          background: '#f8fafc',
          minHeight: 'calc(100vh - 65px)',
          boxSizing: 'border-box'
        }}
      >
        {formContent}
      </main>
    </>
  );
}
