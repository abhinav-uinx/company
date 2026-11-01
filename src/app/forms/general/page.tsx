'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/admin/dashboard/header';
import { useAuth } from '@/components/AuthGuard';

export default function GeneralFormsPage() {
  const router = useRouter();
  const { role, isFolderAllowed } = useAuth();
  const userRole = role || '';

  const otherForms = [
    { name: 'Patient Medical Consent', desc: 'Standard authorization for medical transport' },
    { name: 'Fit to Fly Certificate', desc: 'Doctor clearance form template' },
    { name: 'Escort Medical Report', desc: 'In-flight patient monitoring log' },
    { name: 'Incident Report', desc: 'Log for any unusual in-flight events' },
    { name: 'Equipment Checklist', desc: 'Pre-flight medical bag verification' },
    { name: 'Handover Protocol', desc: 'Hospital-to-hospital transfer notes' }
  ];

  if (role === 'employee' && !isFolderAllowed('forms')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>Document Hub/forms</strong> folder. Please contact an administrator.
        </p>
        <Link href="/user/dashboard" style={{ background: '#4F5DFF', color: '#fff', textDecoration: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .forms-container { max-width: 1300px; margin: 0 auto; padding: 40px 20px; }
        .forms-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; padding-bottom: 10px; }
        .forms-header h1 { font-family: 'Manrope', sans-serif; font-size: 2.2rem; color: #0f172a; font-weight: 800; margin: 0; }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 10px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        
        /* Tabs */
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 25px; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1.05rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab-btn:hover { color: #334155; }
        .tab-btn.active { color: #3b82f6; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #3b82f6; border-radius: 3px 3px 0 0; }
        
        /* Other Forms List */
        .other-forms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .other-form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .other-form-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border-color: #3b82f6; }
        .other-form-info { display: flex; flex-direction: column; gap: 4px; }
        .other-form-name { font-weight: 700; color: #1e293b; font-size: 1.1rem; }
        .other-form-desc { font-size: 0.9rem; color: #64748b; }
        .other-form-icon { color: #94a3b8; transition: color 0.2s; background: #f8fafc; padding: 12px; border-radius: 50%; }
        .other-form-card:hover .other-form-icon { color: #fff; background: #3b82f6; }

        @media (max-width: 768px) {
          .forms-container { padding: 16px 12px calc(75px + env(safe-area-inset-bottom)) !important; }
          .forms-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .forms-header h1 { font-size: 1.5rem !important; }
          .tabs-nav { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; white-space: nowrap !important; }
          .other-forms-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      ` }} />

      <Header />

      <main className="forms-container">
        <div className="forms-header">
          <div>
            <Link href={userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} className="back-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
            </Link>
            <h1>Document Hub</h1>
          </div>
          <div>
            <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>Manage & Download Medical Forms</p>
          </div>
        </div>

        <div className="tabs-nav">
          <Link href="/forms" style={{ textDecoration: 'none' }}>
            <button className="tab-btn">MEDIF Forms</button>
          </Link>
          <Link href="/forms/general" style={{ textDecoration: 'none' }}>
            <button className="tab-btn active">General Forms</button>
          </Link>
        </div>

        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '1.05rem' }}>Access standard operational forms and templates.</p>
          
          <div className="other-forms-grid">
            {otherForms.map((form, idx) => (
              <div className="other-form-card" key={idx}>
                <div className="other-form-info">
                  <span className="other-form-name">{form.name}</span>
                  <span className="other-form-desc">{form.desc}</span>
                </div>
                <span className="material-symbols-outlined other-form-icon">description</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
