'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import Header from './header';

export default function Dashboard() {
  const router = useRouter();
  const { role } = useAuth();
  const userRole = role || 'admin';

  return (
    <>
      <Header />

      <section className="services" id="services">
        <div className="services-head">
          <h2>Services</h2>
        </div>

        <div className="service-grid">

          <div className="service-card" onClick={() => router.push('/customers')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'var(--accent)'}}>person</span>
            </div>
            <h3>Patient Management</h3>
            <Link className="service-open group" href="/customers"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
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

          <div className="service-card" onClick={() => router.push('/vault')} style={{ cursor: 'pointer' }}>
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </div>
            <h3>Document Vault</h3>
            <Link className="service-open group" href="/vault"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
          </div>

          {userRole === 'admin' && (
            <div className="service-card" onClick={() => router.push('/admin/reports')} style={{ cursor: 'pointer' }}>
              <div className="service-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
              </div>
              <h3>Reports &amp; Excel Export</h3>
              <Link className="service-open group" href="/admin/reports"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
            </div>
          )}

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
            <div className="service-card admin-only" onClick={() => router.push('/admin/user')} style={{ cursor: 'pointer' }}>
              <span className="admin-tag">Admin only</span>
              <div className="service-icon icon-admin">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Manage Employee</h3>
              <Link className="service-open group" href="/admin/user"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
            </div>
          )}

          {userRole === 'admin' && (
            <div className="service-card admin-only" onClick={() => router.push('/admin/sessions')} style={{ cursor: 'pointer' }}>
              <span className="admin-tag">Admin only</span>
              <div className="service-icon icon-admin">
                <span className="material-symbols-outlined" style={{fontSize: '28px'}}>security</span>
              </div>
              <h3>Active Sessions</h3>
              <Link className="service-open group" href="/admin/sessions"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>
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
        {userRole === 'admin' && (
          <Link href="/admin/sessions" className="bottom-nav-item">
            <span className="material-symbols-outlined">security</span>
            <span>Sessions</span>
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
