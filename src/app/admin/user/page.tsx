'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import { useAuth } from '@/components/AuthGuard';
import Link from 'next/link';

export default function UserManagementPage(props: any) {
  const embedded = props?.embedded ?? false;
  const router = useRouter();
  const { name, username, role, logout } = useAuth();
  const userName = name || username || 'Admin';
  const [menuOpen, setMenuOpen] = useState(false);

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateMsg, setUpdateMsg] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res: any = await supabaseAuth
      .from('employees')
      .select('iqama_number, name, email, department, job_title, phone_number, role, status, departments(name), roles(role_name)')
      .order('name');
    let data: any = res.data;
    if (res.error && res.error.message.includes('relationship')) {
      const basic: any = await supabaseAuth
        .from('employees')
        .select('iqama_number, name, email, department, job_title, phone_number, role, status')
        .order('name');
      data = basic.data;
    }
    const { data: rData } = await supabaseAuth.from('roles').select('*').order('role_name');
    if (rData) {
      setRolesList(rData);
    }
    const depts = new Set<string>();
    (data || []).forEach((u: any) => depts.add(u.departments?.name || u.department || 'N/A'));
    setDepartments(Array.from(depts));
    setUsers(data || []);
    setLoading(false);
  };

  const updateStatus = async (iqama: string, status: string) => {
    const { error } = await supabaseAuth.from('employees').update({ status }).eq('iqama_number', iqama);
    if (!error) {
      setUsers(prev => prev.map(u => u.iqama_number === iqama ? { ...u, status } : u));
      setUpdateMsg({ id: iqama, text: 'Status updated' });
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  const updateRole = async (iqama: string, role_id: string) => {
    const { error } = await supabaseAuth.from('employees').update({ role: role_id || null }).eq('iqama_number', iqama);
    if (!error) {
      const matchedRole = rolesList.find(r => r.id === role_id);
      setUsers(prev => prev.map(u => u.iqama_number === iqama ? { ...u, role: role_id, roles: matchedRole ? { role_name: matchedRole.role_name } : null } : u));
      setUpdateMsg({ id: iqama, text: 'Role updated' });
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const filteredUsers = users.filter(u => {
    const deptName = u.departments?.name || u.department || 'N/A';
    const matchesFilter = activeFilter === 'All' || deptName === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.iqama_number && u.iqama_number.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .vault-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .vault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .vault-header h1 { font-size: 2rem; margin: 0; color: #0B1220; }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 10px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 25px; flex-wrap: wrap; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; text-decoration: none; display: inline-block; }
        .tab-btn.active { color: #4F5DFF; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #4F5DFF; border-radius: 3px 3px 0 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f8fafc; font-weight: 600; color: #0B1220; font-size: 0.9rem; }
        select { padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; background: #fff; outline: none; }
        select:focus { border-color: #4F5DFF; }
        .search-input { padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9rem; outline: none; width: 220px; transition: all 0.2s; }
        .search-input:focus { border-color: #4F5DFF; box-shadow: 0 0 0 3px rgba(79, 93, 255, 0.1); }
      `}} />

      {!embedded && (
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
              <Link className="navlink" href="/admin/dashboard">Services</Link>
              <Link className="navlink" href="/admin/user" style={{ color: '#4F5DFF', fontWeight: 600 }}>Users</Link>
              <Link className="navlink" href="/admin/directory">Directory</Link>
              <Link className="navlink" href="/admin/reports">Reports</Link>
              <Link className="navlink" href="/admin/sessions">Sessions</Link>
              <Link className="navlink" href="#">Help</Link>
            </nav>
            <div className="user-info" style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setMenuOpen(!menuOpen)}>
              <span className="user-name" style={{ fontWeight: 600 }}>{userName}</span>
              <span className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src="https://ui-avatars.com/api/?name=User&background=0B1220&color=fff" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User" />
              </span>
              {menuOpen && (
                <div style={{ display: 'block', position: 'absolute', right: 0, top: '45px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '180px', zIndex: 9999, padding: '10px' }}>
                  <button style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit Profile
                  </button>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '5px 0' }}></div>
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? "" : "vault-container"}>
        {!embedded && (
          <div className="vault-header">
            <div>
              <Link href="/admin/dashboard" className="back-btn"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard</Link>
              <h1 style={{ marginTop: '15px' }}>User &amp; Employee Management</h1>
            </div>
            <Link href="/admin/directory?tab=add_employee" style={{ background: '#4F5DFF', color: '#fff', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Add New Employee
            </Link>
          </div>
        )}

        {!embedded && (
          <div className="tabs-nav">
            <Link href="/admin/user" className="tab-btn active">Users List</Link>
            <Link href="/admin/directory?tab=attendance" className="tab-btn">Attendance</Link>
            <Link href="/admin/directory?tab=salary" className="tab-btn">Payroll / Salary</Link>
            <Link href="/admin/directory?tab=add_employee" className="tab-btn">Add Employee</Link>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>View, filter, and manage staff credentials, department allocations, and access permissions.</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="text"
                placeholder="Search name, iqama, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <div style={{ position: 'relative' }}>
                <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', fontWeight: 500, color: '#0B1220' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span> Department: {activeFilter}
                </button>
                {filterMenuOpen && (
                  <div style={{ position: 'absolute', top: '40px', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '15px', zIndex: 100, minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0B1220' }}>Departments</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={activeFilter === 'All'} onChange={() => { setActiveFilter('All'); setFilterMenuOpen(false); }} /> All
                      </label>
                      {departments.map(dept => (
                        <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                          <input type="checkbox" style={{ width: 'auto' }} checked={activeFilter === dept} onChange={() => { setActiveFilter(dept); setFilterMenuOpen(false); }} /> {dept}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Iqama / Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Permission Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", position: "relative", height: "300px" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                      <div className="loader" style={{ width: "120px", transform: "scale(0.8)" }}>
                        <div className="logo-layer logo-dim"></div>
                        <div className="logo-layer logo-lit"></div>
                        <div className="charge-mask"><div className="band"></div></div>
                      </div>
                      <div className="loading-label" style={{ color: "#334155", marginTop: "10px" }}>Loading Users...</div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.iqama_number}>
                    <td>
                      <strong>{user.name || 'N/A'}</strong>
                      {updateMsg && updateMsg.id === user.iqama_number && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ {updateMsg.text}</span>
                      )}
                    </td>
                    <td>
                      <strong>{user.iqama_number}</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email || '—'}</span>
                    </td>
                    <td>{user.departments?.name || user.department || 'N/A'}</td>
                    <td>
                      {rolesList.length > 0 ? (
                        <select 
                          value={user.role || ''} 
                          onChange={e => updateRole(user.iqama_number, e.target.value)}
                          style={{
                            background: user.roles?.role_name === 'admin' ? '#fef9c3' : (user.roles?.role_name === 'staff' ? '#dbeafe' : '#f1f5f9'),
                            color: user.roles?.role_name === 'admin' ? '#854d0e' : (user.roles?.role_name === 'staff' ? '#1e40af' : '#475569'),
                            fontWeight: 600,
                            borderColor: '#cbd5e1'
                          }}
                        >
                          <option value="">No Role</option>
                          {rolesList.map(r => (
                            <option key={r.id} value={r.id}>{r.role_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          background: user.roles?.role_name === 'admin' ? '#fef08a' : (user.roles?.role_name === 'staff' ? '#bfdbfe' : '#f1f5f9'), 
                          color: user.roles?.role_name === 'admin' ? '#854d0e' : (user.roles?.role_name === 'staff' ? '#1e40af' : '#475569'),
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {user.roles?.role_name || 'No Role'}
                        </span>
                      )}
                    </td>
                    <td>
                      <select defaultValue={user.status} onChange={e => updateStatus(user.iqama_number, e.target.value)}>
                        <option value="active">Full Access (View + Read)</option>
                        <option value="view_only">View Only</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    No users found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
