'use client';
import { useEffect, useState } from 'react';
import { getSession, logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FormsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getSession();
      if (!session) { router.replace('/login'); return; }
      setUserName(session.username as string || 'User');
      setUserRole(session.role as string || '');
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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

        /* Top Navigation */
        .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; zIndex: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .logo-area { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.2rem; color: #0f172a; letter-spacing: -0.02em; }
        .logo-area img { height: 35px; width: auto; }
        .nav-actions { display: flex; align-items: center; gap: 20px; position: relative; }
        .user-profile { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: background 0.2s; }
        .user-profile:hover { background: #f8fafc; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 0.9rem; }
        .user-info { display: flex; flex-direction: column; }
        .user-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
        .user-role-text { font-size: 0.75rem; color: #64748b; text-transform: capitalize; }
        .dropdown-menu { position: absolute; top: 110%; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); width: 200px; padding: 8px; display: none; flex-direction: column; gap: 4px; z-index: 10; }
        .dropdown-menu.show { display: flex; }
        .dropdown-item { padding: 10px 12px; border-radius: 6px; color: #334155; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 10px; background: none; border: none; text-align: left; transition: all 0.2s; text-decoration: none; }
        .dropdown-item:hover { background: #f1f5f9; color: #0f172a; }
        .dropdown-item.danger { color: #ef4444; }
        .dropdown-item.danger:hover { background: #fef2f2; color: #b91c1c; }
      ` }} />

      <header className="top-nav">
        <div className="logo-area">
          <img src="/Assets/Company logo/main_logo.png" alt="MEDESCORT INTERNATIONAL" />
        </div>
        <div className="nav-actions">
          <div className="user-profile" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="user-info" style={{ textAlign: 'right' }}>
              <span className="user-name">{userName}</span>
              <span className="user-role-text">{userRole}</span>
            </div>
            <div className="avatar">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>expand_more</span>
          </div>

          {menuOpen && (
            <div className="dropdown-menu show">
              <Link href={userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} className="dropdown-item">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span> Dashboard
              </Link>
              <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
              <button onClick={handleLogout} className="dropdown-item danger">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Logout
              </button>
            </div>
          )}
        </div>
      </header>

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







