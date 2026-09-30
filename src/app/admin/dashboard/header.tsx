'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';

export default function Header() {
  const router = useRouter();
  const { name, username, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = name || username || 'Admin';
  const userRole = role || 'admin';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <img src="/Assets/Company logo/main_logo.png" alt="MEDESCORT INTERNATIONAL logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          <div className="brand-word">
            MEDESCORT INTERNATIONAL
            <span>{userRole === 'admin' ? 'Admin Records Portal' : 'Employee Records Portal'}</span>
          </div>
        </div>
        <nav>
          <Link className="navlink" href="#services">Services</Link>
          {userRole === 'admin' && (
            <Link className="navlink" href="/admin/directory">Directory</Link>
          )}
          {userRole === 'admin' && <Link className="navlink" href="/admin/reports">Reports</Link>}
          {userRole === 'admin' && <Link className="navlink" href="/admin/sessions">Sessions</Link>}
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
  );
}
