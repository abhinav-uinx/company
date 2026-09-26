'use client';
import { useEffect, useState } from 'react';
import { getSession, logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';

export default function Directory() {
  const router = useRouter();
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('directory');
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
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
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });
  
  useEffect(() => {

    const fetchUser = async () => {
      const session = await getSession();
      if (!session) { router.replace('/login'); return; }
      const loggedInUser = session.username as string;
      const role = session.role as string;
      setUserRole(role || '');
      const { data } = await supabaseAuth.from('admins').select('*').eq('username', loggedInUser).single();
      if (data) setUserName(data.name || data.username || loggedInUser);
    };
    fetchUser();
    loadUsers();
    loadDepartments();
  }, [router]);


  const loadUsers = async () => {
    setLoading(true);
    let { data, error } = await supabaseAuth.from('employees').select('*, departments(name)').order('name');
    if (error && error.message.includes('relationship')) {
      const basic = await supabaseAuth.from('employees').select('*').order('name');
      data = basic.data;
    }
    const depts = new Set<string>();
    (data || []).forEach(u => depts.add(u.departments?.name || u.department || 'N/A'));
    setDepartments(Array.from(depts));
    setUsers(data || []);
    setLoading(false);
  };

  const loadDepartments = async () => {
    const { data } = await supabaseAuth.from('departments').select('*').order('name');
    if (data) setDeptList(data);
  };

  const updateStatus = async (iqama: string, status: string) => {
    await supabaseAuth.from('employees').update({ status }).eq('iqama_number', iqama);
  };

  const handleLogout = async () => {
    await logout();
    
    router.replace('/login');
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg({ type: '', text: '' });
    const { error } = await supabaseAuth.from('employees').insert([{
      name: newName,
      iqama_number: newIqama,
      password: newPassword,
      email: newEmail,
      department_id: newDeptId || null,
      status: newPermission
    }]);

    if (error) {
      setAddMsg({ type: 'error', text: 'Error adding employee: ' + error.message });
    } else {
      setAddMsg({ type: 'success', text: 'Employee added successfully!' });
      setNewName(''); setNewIqama(''); setNewPassword(''); setNewDeptId(''); setNewEmail(''); setNewPermission('active');
      loadUsers();
    }
  };

  const filteredUsers = activeFilter === 'All' 
    ? users 
    : users.filter(u => (u.departments?.name || u.department || 'N/A') === activeFilter);

  return (
    <>
      
      <style dangerouslySetInnerHTML={{__html: `
        .vault-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .vault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .vault-header h1 { font-size: 2rem; margin: 0; color: #0B1220; }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 10px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; }
        .tab-btn.active { color: #4F5DFF; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #4F5DFF; border-radius: 3px 3px 0 0; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f8fafc; font-weight: 600; color: #0B1220; }
        select { padding: 6px; border-radius: 4px; border: 1px solid #e2e8f0; }
        .form-group { margin-bottom: 15px; max-width: 500px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; color: #0B1220; }
        input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; box-sizing: border-box; }
        .btn-submit { width: 100%; max-width: 500px; padding: 12px; font-size: 1rem; margin-top: 10px; background: #4F5DFF; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .success { color: #16a34a; font-weight: 600; margin-top: 10px; }
        .error { color: #ef4444; font-weight: 600; margin-top: 10px; }
      `}} />

      <div className="topbar">
        <span className="topbar-dot"></span>
        Internal system — Your Company Name employees and administrators only
      </div>

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <svg className="brand-mark" width="36" height="36" viewBox="0 0 40 40" fill="none">
              <rect x="3" y="3" width="34" height="34" rx="10" fill="var(--navy-950)"/>
              <path d="M13 26V14h5.2c2.5 0 4.1 1.4 4.1 3.6 0 1.5-.8 2.6-2.1 3.1l2.5 5.3h-2.9l-2.2-4.8h-1.9V26H13Zm2.7-6.9h2.2c1.1 0 1.8-.6 1.8-1.5s-.7-1.5-1.8-1.5h-2.2v3Z" fill="var(--accent)"/>
            </svg>
            <div className="brand-word">
              Your Company Name
              <span>Employee &amp; Admin Records Portal</span>
            </div>
          </div>
          <nav>
            <Link className="navlink" href="/dashboard">Services</Link>
            <Link className="navlink" href="/directory">Directory</Link>
            <Link className="navlink" href="#">Reports</Link>
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

      <main className="vault-container">
        <div className="vault-header">
          <div>
            <Link href="/dashboard" className="back-btn"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard</Link>
            <h1 style={{ marginTop: '15px' }}>Employee Directory</h1>
          </div>
        </div>

        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>Directory List</button>
   <Link href="/directory/attendance" className="tab-btn" style={{ textDecoration: 'none', color: '#64748b' }}>Attendance</Link>
   <Link href="/directory/salary" className="tab-btn" style={{ textDecoration: 'none', color: '#64748b' }}>Payroll / Salary</Link>
          <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add Employee</button>
        </div>

        <div className={`tab-content ${activeTab === 'directory' ? 'active' : ''}`}>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Manage existing employees and their permissions.</p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', position: 'relative' }}>
            <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', fontWeight: 500, color: '#0B1220' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span> Filter by Department
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

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Iqama / Email</th>
                <th>Department</th>
                <th>Permission Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} style={{padding: "40px", textAlign: "center", position: "relative", height: "300px"}}><div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -50%)"}}><div className="loader" style={{width: "120px", transform: "scale(0.8)"}}><div className="logo-layer logo-dim"></div><div className="logo-layer logo-lit"></div><div className="charge-mask"><div className="band"></div></div></div><div className="loading-label" style={{color: "#334155", marginTop: "10px"}}>Loading Data...</div></div></td></tr> : filteredUsers.map(user => (
                <tr key={user.iqama_number}>
                  <td>{user.name || 'N/A'}</td>
                  <td>
                    <strong>{user.iqama_number}</strong><br/>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email || ''}</span>
                  </td>
                  <td>{user.departments?.name || user.department || 'N/A'}</td>
                  <td>
                    <select defaultValue={user.status} onChange={e => updateStatus(user.iqama_number, e.target.value)}>
                      <option value="active">Full Access (View + Read)</option>
                      <option value="view_only">View Only</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`tab-content ${activeTab === 'add' ? 'active' : ''}`}>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Create a new employee profile and generate their secure login.</p>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" required value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Iqama Number (Unique ID)</label>
                <input type="text" placeholder="1234567890" required value={newIqama} onChange={e => setNewIqama(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="employee@company.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    style={{ paddingRight: '40px' }}
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        cursor: 'pointer', 
                        color: '#94a3b8',
                        userSelect: 'none',
                        fontSize: '20px'
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select style={{ width: '100%', padding: '10px' }} value={newDeptId} onChange={e => setNewDeptId(e.target.value)}>
                  <option value="">No Department (N/A)</option>
                  {deptList.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Permission Level</label>
                <select style={{ width: '100%', padding: '10px' }} value={newPermission} onChange={e => setNewPermission(e.target.value)}>
                  <option value="active">Full Access (View + Read)</option>
                  <option value="view_only">View Only</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Module Access Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  {['customers', 'escorts', 'documentation', 'invoices', 'reports'].map(mod => (
                    <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 400 }}>
                      <input 
                        type="checkbox" 
                        style={{ width: 'auto' }} 
                        checked={newPermissions.includes(mod)} 
                        onChange={(e) => {
                          if (e.target.checked) setNewPermissions([...newPermissions, mod]);
                          else setNewPermissions(newPermissions.filter(p => p !== mod));
                        }} 
                      /> {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-submit">Add Employee</button>
              {addMsg.text && <div className={addMsg.type === 'error' ? 'error' : 'success'}>{addMsg.text}</div>}
            </form>
          </div>
        </div>
      </main>
    </>
  );
}


