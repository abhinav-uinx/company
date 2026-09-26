const fs = require('fs');

function redesign() {
  let c = fs.readFileSync('src/app/admin/directory/add_employee/page.tsx', 'utf8');

  const newUI = `
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  <input type="email" placeholder="employee@company.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
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
                        <span className="material-symbols-outlined" style={{ color: isChecked ? '#10b981' : '#94a3b8' }}>{(icons)[mod]}</span>
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
              <div style={{ padding: '15px', borderRadius: '8px', background: addMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: addMsg.type === 'error' ? '#b91c1c' : '#15803d', border: \`1px solid \${addMsg.type === 'error' ? '#f87171' : '#4ade80'}\`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">{addMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                {addMsg.text}
              </div>
            )}
          </form>
        </div>`;

  const startForm = c.indexOf('<div style={{ background: \'#fff\', padding: \'30px\', borderRadius: \'8px\', boxShadow: \'0 1px 3px rgba(0,0,0,0.1)\', maxWidth: \'600px\', margin: \'0 auto\' }}>');
  if (startForm !== -1) {
    const endForm = c.indexOf('</form>') + 7;
    const endDiv = c.indexOf('</div>', endForm) + 6;
    c = c.substring(0, startForm) + newUI + c.substring(endDiv);
    
    // Fix TS error mapping icons 
    c = c.replace('{(icons)[mod]}', '{(icons as any)[mod]}');
    
    fs.writeFileSync('src/app/admin/directory/add_employee/page.tsx', c);
    console.log('UI Updated successfully');
  } else {
    console.log('Could not find the start string');
  }
}

redesign();
