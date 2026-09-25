'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [medifCount, setMedifCount] = useState(0);
  
  useEffect(() => {
    const loggedInUser = Cookies.get('loggedInUser');
    const role = Cookies.get('userRole');
    setUserRole(role || '');

    const fetchUser = async () => {
      const table = role === 'admin' ? 'admins' : 'employees';
      const idField = role === 'admin' ? 'username' : 'iqama_number';
      const { data } = await supabaseAuth.from(table).select('*').eq(idField, loggedInUser).single();
      if (data) {
        setUserName(data.name || data.username || loggedInUser);
      }
    };
    fetchUser();

    supabaseAuth.from('medif_records').select('*', { count: 'exact', head: true }).then(({ count }) => {
      setMedifCount(count || 0);
    });
  }, [router]);


  const handleLogout = () => {
    Cookies.remove('loggedInUser');
    Cookies.remove('userRole');
    router.replace('/login');
  };

  return (
    <>
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
            <Link className="navlink" href="#services">Services</Link>
            {userRole === 'admin' && (
              <Link className="navlink" href="/directory">Directory</Link>
            )}
            <Link className="navlink" href="/reports">Reports</Link>
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

      <section className="services" id="services">
        <div className="services-head">
          <h2>Services</h2>
        </div>

        <div className="service-grid">

          <div className="service-card" onClick={() => router.push('/patients')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'var(--accent)'}}>person</span>
            </div>
            <h3>Patient Management</h3>
            <Link className="service-open group" href="/patients"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          <div className="service-card" onClick={() => router.push('/escorts')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'var(--accent)'}}>flight_takeoff</span>
            </div>
            <h3>Escort Missions</h3>
            <Link className="service-open group" href="/escorts"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          <div className="service-card" onClick={() => router.push('/documentation')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'var(--accent)'}}>description</span>
            </div>
            <h3>Documentation Services</h3>
            <Link className="service-open group" href="/documentation"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          <div className="service-card" onClick={() => router.push('/invoices')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'var(--accent)'}}>request_quote</span>
            </div>
            <h3>Invoicing & Billing</h3>
            <Link className="service-open group" href="/invoices"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          
          <div className="service-card" onClick={() => router.push('/medif/new')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.5-2 2-3.5 2-5a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 5 8 11 9 12 .5-.4 2.2-1.7 4-3.5"/></svg>
            </div>
            <h3>Medical Escort Service</h3>
            <Link className="service-open group" href="/medif/new"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          <div className="service-card" onClick={() => router.push('/vault')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </div>
            <h3>Document Vault</h3>
            <span className="doc-count">{medifCount} documents stored</span>
            <Link className="service-open group" href="/vault"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          <div className="service-card" onClick={() => router.push('/reports')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
            </div>
            <h3>Reports &amp; Excel Export</h3>
            <Link className="service-open group" href="/reports"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>


          {userRole === 'admin' && (
            <div className="service-card admin-only" onClick={() => router.push('#')} style={{ cursor: 'pointer' }}>
              <span className="admin-tag">Admin only</span>
              <div className="service-icon icon-admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3>Salary &amp; Payroll</h3>
              <Link className="service-open group" href="#"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
            </div>
          )}

          <div className="service-card" onClick={() => router.push('/forms')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </div>
            <h3>Forms</h3>
            <Link className="service-open group" href="/forms"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          {userRole === 'admin' && (
            <div className="service-card admin-only" onClick={() => router.push('/directory')} style={{ cursor: 'pointer' }}>
              <span className="admin-tag">Admin only</span>
              <div className="service-icon icon-admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Manage Employee</h3>
              <Link className="service-open group" href="/directory"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
