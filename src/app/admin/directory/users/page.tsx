'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import Header from '@/app/admin/dashboard/header';
import { notifyPermissionsChanged, subscribeToPermissionsChanges } from '@/lib/permissionsSync';
import { DepartmentFilter, UserTableRow } from './components';

export default function UsersListPage(props: any) {
  const embedded = props?.embedded ?? false;
  // State
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

    // Unified real-time subscriber (Supabase Realtime, BroadcastChannel, LocalStorage, Focus)
    const unsubscribe = subscribeToPermissionsChanges(() => {
      loadUsers();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatDepartment = (deptStr: string) => {
    if (!deptStr || deptStr === 'N/A') return 'N/A';
    let formatted = deptStr;
    formatted = formatted.replace(/d69ccefc-045a-4bb1-8c27-99120e16610b/gi, 'Nurse');
    formatted = formatted.replace(/Human Resources/gi, 'HR');
    return formatted.split(',').map(s => s.trim()).filter(Boolean).join(' / ');
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, rolesRes] = await Promise.all([
        supabaseAuth.from('employees').select('*').order('name'),
        supabaseAuth.from('departments').select('*').order('name'),
        supabaseAuth.from('roles').select('*').order('role_name')
      ]);

      const depts = deptRes.data || [];
      const roles = rolesRes.data || [];
      setRolesList(roles);

      const deptMap: Record<string, string> = {};
      depts.forEach((d: any) => { deptMap[d.id] = d.name; });

      const roleMap: Record<string, string> = {};
      roles.forEach((r: any) => { roleMap[r.id] = r.role_name; });

      const formattedUsers = (empRes.data || []).map((u: any) => {
        const deptName = deptMap[u.department_id || u.department] || u.department || 'N/A';
        const roleName = roleMap[u.role] || u.role || 'staff';
        return {
          ...u,
          departments: { name: deptName },
          roles: { role_name: roleName }
        };
      });

      const uniqueDepts = new Set<string>();
      formattedUsers.forEach((u: any) => uniqueDepts.add(formatDepartment(u.departments?.name || u.department || 'N/A')));
      setDepartments(Array.from(uniqueDepts));
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (idOrIqama: string, status: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrIqama);
    const { error } = await supabaseAuth.from('employees').update({ status }).eq(isUuid ? 'id' : 'iqama_number', idOrIqama);
    if (!error) {
      setUsers(prev => prev.map(u => (u.id === idOrIqama || u.iqama_number === idOrIqama) ? { ...u, status } : u));
      setUpdateMsg({ id: idOrIqama, text: 'Status updated' });
      notifyPermissionsChanged(idOrIqama);
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  const assignAsNurse = async (idOrIqama: string, currentDeptStr: string, isCurrentlyNurse?: boolean) => {
    const nurseId = 'd69ccefc-045a-4bb1-8c27-99120e16610b';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrIqama);
    const targetUser = users.find(u => u.id === idOrIqama || u.iqama_number === idOrIqama);

    const currentlyNurse = isCurrentlyNurse !== undefined
      ? isCurrentlyNurse
      : ((targetUser?.departments?.name || currentDeptStr || '').toLowerCase().includes('nurse') ||
         (currentDeptStr || '').includes(nurseId) ||
         targetUser?.department_id === nurseId);

    if (currentlyNurse) {
      // Remove Nurse assignment
      const parts = (currentDeptStr || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s.toLowerCase() !== 'nurse' && s !== nurseId);

      const newDept = parts.length > 0 ? parts.join(',') : null;
      const updatePayload: any = { department: newDept };

      if (targetUser?.department_id === nurseId) {
        updatePayload.department_id = parts.length > 0 ? parts[0] : null;
      }

      const { error } = await supabaseAuth
        .from('employees')
        .update(updatePayload)
        .eq(isUuid ? 'id' : 'iqama_number', idOrIqama);

      if (!error) {
        setUsers(prev => prev.map(u => {
          if (u.id === idOrIqama || u.iqama_number === idOrIqama) {
            const nextDeptId = updatePayload.department_id !== undefined ? updatePayload.department_id : u.department_id;
            return {
              ...u,
              department: newDept,
              department_id: nextDeptId,
              departments: { name: newDept || 'N/A' }
            };
          }
          return u;
        }));
        await loadUsers();
        setUpdateMsg({ id: idOrIqama, text: 'Removed as Nurse' });
        notifyPermissionsChanged(idOrIqama);
        setTimeout(() => setUpdateMsg(null), 3000);
      } else {
        alert('Error updating department: ' + error.message);
      }
    } else {
      // Assign Nurse
      let newDept = currentDeptStr || '';
      if (!newDept.includes(nurseId)) {
        newDept = newDept ? `${newDept},${nurseId}` : nurseId;
      }
      const updatePayload: any = { department: newDept };
      if (!targetUser?.department_id) {
        updatePayload.department_id = nurseId;
      }

      const { error } = await supabaseAuth
        .from('employees')
        .update(updatePayload)
        .eq(isUuid ? 'id' : 'iqama_number', idOrIqama);

      if (!error) {
        setUsers(prev => prev.map(u => {
          if (u.id === idOrIqama || u.iqama_number === idOrIqama) {
            return {
              ...u,
              department: newDept,
              department_id: updatePayload.department_id || u.department_id,
              departments: { name: newDept }
            };
          }
          return u;
        }));
        await loadUsers();
        setUpdateMsg({ id: idOrIqama, text: 'Assigned as Nurse' });
        notifyPermissionsChanged(idOrIqama);
        setTimeout(() => setUpdateMsg(null), 3000);
      } else {
        alert('Error updating department: ' + error.message);
      }
    }
  };

  const deleteUser = async (idOrIqama: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrIqama);
    const { error } = await supabaseAuth.from('employees').delete().eq(isUuid ? 'id' : 'iqama_number', idOrIqama);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== idOrIqama && u.iqama_number !== idOrIqama));
      setUpdateMsg({ id: idOrIqama, text: 'User deleted' });
      notifyPermissionsChanged(idOrIqama);
      setTimeout(() => setUpdateMsg(null), 3000);
    } else {
      alert('Error deleting user: ' + error.message);
    }
  };

  const updateRole = async (idOrIqama: string, roleId: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrIqama);
    const matchedRole = rolesList.find(r => r.id === roleId || r.role_name === roleId);
    const roleVal = matchedRole ? matchedRole.id : roleId;
    const roleName = matchedRole ? matchedRole.role_name : roleId;

    const { error } = await supabaseAuth
      .from('employees')
      .update({ role: roleVal })
      .eq(isUuid ? 'id' : 'iqama_number', idOrIqama);

    if (!error) {
      setUsers(prev => prev.map(u => (u.id === idOrIqama || u.iqama_number === idOrIqama) ? {
        ...u,
        role: roleVal,
        roles: { role_name: roleName }
      } : u));
      setUpdateMsg({ id: idOrIqama, text: `Role: ${roleName.toUpperCase()}` });
      notifyPermissionsChanged(idOrIqama);
      setTimeout(() => setUpdateMsg(null), 3000);
    } else {
      alert('Error updating role: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const deptName = formatDepartment(u.departments?.name || u.department || 'N/A');
    const matchesFilter = activeFilter === 'All' || deptName === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const roleName = (u.roles?.role_name || u.role || '').toLowerCase();
    const matchesSearch = !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.iqama_number && u.iqama_number.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (deptName && deptName.toLowerCase().includes(q)) ||
      (roleName && roleName.includes(q)) ||
      (u.job_title && u.job_title.toLowerCase().includes(q));
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
        th, td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
        th { background: #f8fafc; font-weight: 600; color: #0B1220; font-size: 0.88rem; }
        select { padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; background: #fff; outline: none; }
        select:focus { border-color: #4F5DFF; }
        .search-input { height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9rem; outline: none; width: 240px; transition: all 0.2s; box-sizing: border-box; }
        .search-input:focus { border-color: #4F5DFF; box-shadow: 0 0 0 3px rgba(79, 93, 255, 0.1); }
      `}} />

      {!embedded && <Header />}

      <main className={embedded ? "" : "vault-container"}>
        {!embedded && (
          <div className="vault-header">
            <div>
              <Link href="/admin/dashboard" className="back-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
              </Link>
              <h1 style={{ marginTop: '15px' }}>User &amp; Employee Management</h1>
            </div>
            <Link
              href="/admin/directory?tab=add_employee"
              style={{
                background: '#4F5DFF',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Add New Employee
            </Link>
          </div>
        )}

        {!embedded && (
          <div className="tabs-nav">
            <Link href="/admin/directory?tab=users" className="tab-btn active">Users List</Link>
            <Link href="/admin/directory?tab=customize" className="tab-btn">Customize Folder Access</Link>
            <Link href="/admin/directory?tab=attendance" className="tab-btn">Attendance</Link>
            <Link href="/admin/directory?tab=salary" className="tab-btn">Payroll / Salary</Link>
            <Link href="/admin/directory?tab=add_employee" className="tab-btn">Add Employee</Link>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
              View, filter, and manage staff credentials, department allocations, and access permissions.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="text"
                placeholder="Search name, iqama, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <DepartmentFilter
                departments={departments}
                activeFilter={activeFilter}
                isOpen={filterMenuOpen}
                onToggle={() => setFilterMenuOpen(!filterMenuOpen)}
                onSelect={(dept) => {
                  setActiveFilter(dept);
                  setFilterMenuOpen(false);
                }}
              />
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Name &amp; Title</th>
                <th style={{ minWidth: '150px' }}>Iqama / Email</th>
                <th style={{ minWidth: '140px' }}>Department</th>
                <th style={{ minWidth: '140px' }}>System Role</th>
                <th style={{ minWidth: '160px' }}>Permission Level</th>
                <th style={{ minWidth: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", position: "relative", height: "300px" }}>
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
                  <UserTableRow
                    key={user.iqama_number || user.id}
                    user={user}
                    rolesList={rolesList}
                    updateMsg={updateMsg}
                    formatDepartment={formatDepartment}
                    onUpdateStatus={updateStatus}
                    onUpdateRole={updateRole}
                    onAssignAsNurse={assignAsNurse}
                    onDeleteUser={deleteUser}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
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
