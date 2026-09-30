'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';

export default function AddEmployee(props: any) {
  const embedded = props?.embedded ?? false;
  const router = useRouter();
  
  // Add Employee Form State
  const [newName, setNewName] = useState('');
  const [newIqama, setNewIqama] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPermission, setNewPermission] = useState('active');
  const [newPermissions, setNewPermissions] = useState(['customers', 'escorts', 'documentation', 'invoices', 'reports']);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadData = async () => {
      const { data: dData } = await supabaseAuth.from('departments').select('*').order('name');
      if (dData) setDeptList(dData);
      
      const { data: rData } = await supabaseAuth.from('roles').select('*').order('role_name');
      if (rData) {
        setRolesList(rData);
        if (rData.length > 0) setSelectedRole(rData[0].id);
      }
    };
    loadData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg({ type: '', text: '' });
    const { error } = await supabaseAuth.from('employees').insert([{
      name: newName,
      iqama_number: newIqama,
      password: newPassword,
      email: newEmail,
      department_id: newDeptId || null,
      status: newPermission,
      role: selectedRole || null
    }]);

    if (error) {
      setAddMsg({ type: 'error', text: 'Error adding employee: ' + error.message });
    } else {
      setAddMsg({ type: 'success', text: 'Employee added successfully!' });
      setNewName(''); setNewIqama(''); setNewPassword(''); setNewDeptId(''); setNewEmail(''); setNewPermission('active');
    }
  };

  const formContent = (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {!embedded && (
        <div style={{ marginBottom: '30px' }}>
          <Link href="/admin/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0ea5e9', textDecoration: 'none', marginBottom: '15px', fontWeight: 600, fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Directory
          </Link>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Add New Employee</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>Create a new employee profile and generate their secure login.</p>
        </div>
      )}
      
      <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Section 1: Personal Info */}
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <span className="material-symbols-outlined" style={{ color: '#0ea5e9', fontSize: '24px', background: '#e0f2fe', padding: '8px', borderRadius: '8px' }}>person</span>
                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Personal Details</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Full Name *</label>
                  <input type="text" placeholder="e.g. John Doe" required value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', transition: 'all 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Iqama Number (Unique ID) *</label>
                  <input type="text" placeholder="e.g. 1234567890" required value={newIqama} onChange={e => setNewIqama(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Email Address *</label>
                  <input type="email" placeholder="employee@medescortinternational.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
              </div>
            </div>

            {/* Section 2: Security */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: '24px', background: '#ede9fe', padding: '8px', borderRadius: '8px' }}>lock</span>
                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Account Security</h2>
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Temporary Password *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Set initial password" 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'} 
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>The employee will use this to log in for the first time.</p>
              </div>
            </div>

            {/* Section 3: Roles & Permissions */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '24px', background: '#d1fae5', padding: '8px', borderRadius: '8px' }}>shield_person</span>
                <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Roles &amp; Access</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Department</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={newDeptId} onChange={e => setNewDeptId(e.target.value)}>
                    <option value="">No Department (N/A)</option>
                    {deptList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Role</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                    <option value="">No Role</option>
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.role_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Account Status</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer' }} value={newPermission} onChange={e => setNewPermission(e.target.value)}>
                    <option value="active">Active (Full Access)</option>
                    <option value="view_only">View Only</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '12px', display: 'block' }}>Module Access</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {['customers', 'escorts', 'documentation', 'invoices', 'reports'].map(mod => {
                    const icons = { customers: 'groups', escorts: 'flight_takeoff', documentation: 'description', invoices: 'receipt_long', reports: 'bar_chart' };
                    const isChecked = newPermissions.includes(mod);
                    return (
                      <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '8px', border: isChecked ? '2px solid #10b981' : '1px solid #e2e8f0', background: isChecked ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: '18px', height: '18px', accentColor: '#10b981' }} 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) setNewPermissions([...newPermissions, mod]);
                            else setNewPermissions(newPermissions.filter(p => p !== mod));
                          }} 
                        /> 
                        <span className="material-symbols-outlined" style={{ color: isChecked ? '#10b981' : '#94a3b8' }}>{(icons as any)[mod]}</span>
                        <span style={{ fontWeight: 500, color: isChecked ? '#065f46' : '#334155' }}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
              <Link href="/admin/directory" style={{ padding: '12px 24px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>Cancel</Link>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)' }}>
                <span className="material-symbols-outlined">person_add</span>
                Create Employee
              </button>
            </div>
            
            {addMsg.text && (
              <div style={{ padding: '15px', borderRadius: '8px', background: addMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: addMsg.type === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${addMsg.type === 'error' ? '#f87171' : '#4ade80'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">{addMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                {addMsg.text}
              </div>
            )}
          </form>
    </div>
  );

  if (embedded) return formContent;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <img src="/Assets/Company logo/main_logo.png" alt="MEDESCORT INTERNATIONAL logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
            <div className="brand-word">
              MEDESCORT INTERNATIONAL
              <span>Employee &amp; Admin Records Portal</span>
            </div>
          </div>
          <nav>
            <Link className="navlink" href="/admin/dashboard">Dashboard</Link>
            <Link className="navlink" href="/admin/user">Users</Link>
            <Link className="navlink" href="/admin/directory" style={{ color: 'var(--primary)' }}>Directory</Link>
          </nav>
        </div>
      </header>

      <main className="dashboard-main" style={{ padding: '40px 20px', background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
        {formContent}
      </main>
    </>
  );
}








