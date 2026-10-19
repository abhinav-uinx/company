'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import { supabaseAuth } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const { name, username, role, logout, isFolderAllowed } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = name || username || 'Employee';
  const userRole = role || 'employee';

  const [deniedToast, setDeniedToast] = useState<{ show: boolean; folderName: string }>({ show: false, folderName: '' });

  const handleCardClick = (folderKey: string, folderName: string, destination: string) => {
    if (!isFolderAllowed(folderKey)) {
      setDeniedToast({ show: true, folderName });
      setTimeout(() => setDeniedToast({ show: false, folderName: '' }), 4000);
      return;
    }
    router.push(destination);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
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

      {/* Denied Access Toast */}
      {deniedToast.show && (
        <div style={{
          position: 'fixed',
          top: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: '0.92rem',
          border: '1px solid #dc2626'
        }}>
          <span className="red-cross-badge" style={{ background: '#fff', color: '#ef4444' }}>✕</span>
          Access Prohibited: You do not have permission to access the "{deniedToast.folderName}" folder. Please contact an administrator.
        </div>
      )}

      <section className="services" id="services">
        <div className="services-head">
          <h2>Services</h2>
        </div>

        <div className="service-grid">

          {/* Customer Management */}
          <div
            className={`service-card ${!isFolderAllowed('customers') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('customers', 'Customer Management', '/customers')}
            style={{ cursor: isFolderAllowed('customers') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('customers') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '22px'}}>person</span>
            </div>
            <h3>Customer Management</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              {isFolderAllowed('customers') ? 'Add / Manage' : 'Access Prohibited'}
            </p>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('customers') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Escort Missions */}
          <div
            className={`service-card ${!isFolderAllowed('escorts') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('escorts', 'Escort Missions', '/escorts')}
            style={{ cursor: isFolderAllowed('escorts') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('escorts') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '22px'}}>flight_takeoff</span>
            </div>
            <h3>Escort Missions</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              {isFolderAllowed('escorts') ? 'Active Flights & Missions' : 'Access Prohibited'}
            </p>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('escorts') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Documentation Services */}
          <div
            className={`service-card ${!isFolderAllowed('documentation') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('documentation', 'General Services', '/documentation')}
            style={{ cursor: isFolderAllowed('documentation') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('documentation') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '22px'}}>description</span>
            </div>
            <h3>General Services</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              {isFolderAllowed('documentation') ? 'Attestation & Files' : 'Access Prohibited'}
            </p>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('documentation') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Invoicing & Billing */}
          <div
            className={`service-card ${!isFolderAllowed('invoices') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('invoices', 'Invoicing & Billing', '/invoices')}
            style={{ cursor: isFolderAllowed('invoices') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('invoices') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '22px'}}>request_quote</span>
            </div>
            <h3>Invoicing &amp; Billing</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              {isFolderAllowed('invoices') ? 'Accounts & Receipts' : 'Access Prohibited'}
            </p>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('invoices') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Document Vault */}
          <div
            className={`service-card ${!isFolderAllowed('vault') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('vault', 'Document Vault', '/vault')}
            style={{ cursor: isFolderAllowed('vault') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('vault') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </div>
            <h3>Document Vault</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
              {isFolderAllowed('vault') ? 'Archive Repository' : 'Access Prohibited'}
            </p>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('vault') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Reports & Excel Export */}
          {(userRole === 'admin' || isFolderAllowed('reports')) && (
            <div
              className={`service-card ${!isFolderAllowed('reports') ? 'access-disabled-btn' : ''}`}
              onClick={() => handleCardClick('reports', 'Cloud Admin Reports & Analytics', '/admin/reports')}
              style={{ cursor: isFolderAllowed('reports') ? 'pointer' : undefined, position: 'relative' }}
            >
              {!isFolderAllowed('reports') && (
                <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
              )}
              <div className="service-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
              </div>
              <h3>Cloud Admin Reports &amp; Analytics</h3>
              <div className="service-open group">
                <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                  {isFolderAllowed('reports') ? 'arrow_forward' : 'block'}
                </span>
              </div>
            </div>
          )}

          {/* Salary & Payroll */}
          {(userRole === 'admin' || isFolderAllowed('salary')) && (
            <div
              className={`service-card admin-only ${!isFolderAllowed('salary') ? 'access-disabled-btn' : ''}`}
              onClick={() => handleCardClick('salary', 'Salary & Payroll', '/admin/directory?tab=salary')}
              style={{ cursor: isFolderAllowed('salary') ? 'pointer' : undefined, position: 'relative' }}
            >
              {!isFolderAllowed('salary') && (
                <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
              )}
              <span className="admin-tag">Payroll</span>
              <div className="service-icon icon-admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3>Salary &amp; Payroll</h3>
              <div className="service-open group">
                <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                  {isFolderAllowed('salary') ? 'arrow_forward' : 'block'}
                </span>
              </div>
            </div>
          )}

          {/* Forms */}
          <div
            className={`service-card ${!isFolderAllowed('forms') ? 'access-disabled-btn' : ''}`}
            onClick={() => handleCardClick('forms', 'Document Hub/forms', '/forms')}
            style={{ cursor: isFolderAllowed('forms') ? 'pointer' : undefined, position: 'relative' }}
          >
            {!isFolderAllowed('forms') && (
              <span className="red-cross-badge" style={{ position: 'absolute', top: '14px', right: '14px' }} title="Access Disabled">✕</span>
            )}
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            </div>
            <h3>Document Hub/forms</h3>
            <div className="service-open group">
              <span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                {isFolderAllowed('forms') ? 'arrow_forward' : 'block'}
              </span>
            </div>
          </div>

          {/* Directory for Admin */}
          {userRole === 'admin' && (
            <div className="service-card admin-only" onClick={() => router.push('/admin/directory')} style={{ cursor: 'pointer' }}>
              <span className="admin-tag">Admin only</span>
              <div className="service-icon icon-admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Employee Directory &amp; Records</h3>
              <Link className="service-open group" href="/admin/directory"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
            </div>
          )}

        </div>
      </section>
    
      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link href="#services" className="bottom-nav-item">
          <span className="material-symbols-outlined">grid_view</span>
          <span>Services</span>
        </Link>
        {userRole === 'admin' && (
          <Link href="/admin/directory" className="bottom-nav-item">
            <span className="material-symbols-outlined">folder_shared</span>
            <span>Directory</span>
          </Link>
        )}
        {userRole === 'admin' && (
          <Link href="/admin/reports" className="bottom-nav-item">
            <span className="material-symbols-outlined">bar_chart</span>
            <span>Reports</span>
          </Link>
        )}
        <Link href="#" className="bottom-nav-item">
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </Link>
      </div>
    </>
  );
}
