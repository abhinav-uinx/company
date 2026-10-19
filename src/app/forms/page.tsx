'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/admin/dashboard/header';
import { useAuth } from '@/components/AuthGuard';

export default function FormsPage() {
  const router = useRouter();
  const { role, isFolderAllowed } = useAuth();
  const userRole = role || '';



    const airlines = [
    { name: 'Emirates', iata: 'EK', localFile: '/forms/MEDIF FORMS/emirates-medif-form.pdf' },
    { name: 'Air India', iata: 'AI', localFile: '/forms/MEDIF FORMS/Air India MEDIF form.pdf' },
    { name: 'SriLankan Airlines', iata: 'UL', localFile: '/forms/MEDIF FORMS/Sri LankanAirlines_MEDIF.pdf' },
    { name: 'Qatar Airways', iata: 'QR' },
    { name: 'Etihad Airways', iata: 'EY' },
    { name: 'Saudi Airlines', iata: 'SV' },
    { name: 'Turkish Airlines', iata: 'TK' },
    { name: 'Lufthansa', iata: 'LH' },
    { name: 'Air France', iata: 'AF' },
    { name: 'British Airways', iata: 'BA' },
    { name: 'EgyptAir', iata: 'MS' },
    { name: 'Gulf Air', iata: 'GF' },
    { name: 'KLM', iata: 'KL' },
    { name: 'Royal Jordanian', iata: 'RJ' },
    { name: 'Oman Air', iata: 'WY' },
    { name: 'Middle East Airlines', iata: 'ME' },
    { name: 'FlyDubai', iata: 'FZ' }
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
        .back-btn { display: inline-flex; align-items: center; gap: 8px; color: #3b82f6; text-decoration: none; font-weight: 600; margin-bottom: 15px; font-size: 0.95rem; }
        .back-btn:hover { text-decoration: underline; }
        
        /* Tabs */
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 25px; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1.05rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab-btn:hover { color: #334155; }
        .tab-btn.active { color: #3b82f6; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #3b82f6; border-radius: 3px 3px 0 0; }
        
        /* Airline Grid layout: exactly 4 in a row */
        .airline-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        
        @media (max-width: 1100px) { .airline-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .airline-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .airline-grid { grid-template-columns: 1fr; } }
        
        .airline-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 15px; display: flex; align-items: center; justify-content: flex-start; gap: 15px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.015); text-decoration: none; cursor: pointer; }
        .airline-card:hover { border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.05); }
        .logo-container { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; padding: 4px; border: 1px solid #f1f5f9; }
        .airline-logo { max-height: 100%; max-width: 100%; object-fit: contain; }
        .airline-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 5px; }
        .local-badge { font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 10px; font-weight: 700; margin-left: 6px; flex-shrink: 0; vertical-align: middle; }

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
          <button className="tab-btn active">MEDIF Forms</button>
          <Link href="/forms/general" className="tab-btn" style={{ textDecoration: 'none' }}>General Forms</Link>
        </div>

        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '1.05rem' }}>Select an airline to download their specific Medical Information Form (MEDIF).</p>
          
          <div className="airline-grid">
            {airlines.map((airline, idx) => {
              const linkTarget = (airline as any).localFile 
                ? encodeURI((airline as any).localFile) 
                : `https://www.google.com/search?q=${encodeURIComponent(airline.name + ' MEDIF form filetype:pdf')}`;

              return (
                <a href={linkTarget} target="_blank" rel="noopener noreferrer" className="airline-card" key={idx} title={`Download ${airline.name} MEDIF Form`}>
                  <div className="logo-container">
                    <img 
                      src={`https://content.airhex.com/content/logos/airlines_${(airline as any).iata}_100_100_s.png?md5apikey=6a9ab7c143ee73b39109481d6f6e59a4`} 
                      alt={`${airline.name} Logo`} 
                      className="airline-logo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(airline.name)}&background=f1f5f9&color=334155&font-size=0.33&length=2`;
                      }}
                    />
                  </div>
                  <div className="airline-name">
                    {airline.name} 
                    {(airline as any).localFile && <span className="local-badge">PDF</span>}
                  </div>
                </a>
              );
            })}
          </div>
          
          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
            Emirates logo: <a href="https://airhex.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b' }}>Airline logos by Airhex</a>
          </div>
        </div>
      </main>
    </>
  );
}







