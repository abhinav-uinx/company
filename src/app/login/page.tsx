'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import LoadingIcon from '@/components/LoadingIcon';
import { login } from '@/app/actions/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 'idle' | 'authenticating' | 'done'
  const [phase, setPhase] = useState<'idle' | 'authenticating' | 'done'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      if (res.success) {
        // 1. Start animation — slide right panel out, expand left
        setPhase('authenticating');

        // 2. After logo spin + "Authenticating" text (~2.2s), fade to white then push router
        setTimeout(() => {
          setPhase('done');
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1400); // fade duration
        }, 2400);
      } else {
        setError(res.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login.');
      setLoading(false);
    }
  };

  const isAuth = phase === 'authenticating' || phase === 'done';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spinLand {
          0%   { transform: rotate(0deg) scale(0.7); opacity: 0; }
          40%  { transform: rotate(340deg) scale(1.08); opacity: 1; }
          60%  { transform: rotate(355deg) scale(0.97); }
          75%  { transform: rotate(362deg) scale(1.02); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        @keyframes dotDot {
          0%   { content: ''; }
          33%  { content: '.'; }
          66%  { content: '..'; }
          100% { content: '...'; }
        }

        .auth-logo {
          animation: spinLand 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .auth-text {
          animation: fadeInUp 0.5s ease 1.1s both;
        }

        .auth-dots::after {
          content: '';
          animation: dotDot 1.2s steps(1) 1.3s infinite;
        }

        .page-fade-out {
          animation: pageFade 1.4s ease forwards;
        }

        @keyframes pageFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      ` }} />

      {/* Full-screen overlay fade when done */}
      {phase === 'done' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0a1628',
          animation: 'pageFade 0.6s ease reverse, pageFade 0.6s ease 0.05s forwards',
        }} />
      )}

      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'row',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── Left brand panel ── */}
        <div style={{
          flex: isAuth ? '1 0 100%' : '1',
          background: 'linear-gradient(160deg, #0a1f4e 0%, #0d2b6b 45%, #091628 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'flex 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 2,
        }}>
          {/* Glow blobs */}
          <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', top:'-200px', left:'-150px', pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', bottom:'-100px', right:'-100px', pointerEvents:'none' }} />

          {/* Logo — normal in idle, spin-land in auth */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {isAuth ? (
              <Image
                key="spinning"
                src="/Assets/Company logo/main_logo.png"
                alt="Logo"
                width={isAuth ? 260 : 200}
                height={isAuth ? 142 : 110}
                priority
                className="auth-logo"
                style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))', transition: 'width 0.4s, height 0.4s' }}
              />
            ) : (
              <Image
                key="static"
                src="/Assets/Company logo/main_logo.png"
                alt="Logo"
                width={200}
                height={110}
                priority
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
              />
            )}
          </div>

          {/* Divider */}
          <div style={{ width:'40px', height:'3px', background:'linear-gradient(90deg,#3b82f6,#1d4ed8)', borderRadius:'2px', position:'relative', zIndex:2 }} />

          {isAuth ? (
            /* Authenticating state */
            <div className="auth-text" style={{ position:'relative', zIndex:2, textAlign:'center' }}>
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.03em',
                margin: 0,
                animation: 'pulse 1.5s ease-in-out 1.3s infinite',
              }}>
                Authenticating<span className="auth-dots" />
              </p>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginTop:'8px' }}>
                Please wait while we verify your credentials
              </p>
            </div>
          ) : (
            /* Normal tagline */
            <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
              <h1 style={{ fontSize:'1.625rem', fontWeight:700, color:'#fff', letterSpacing:'-0.5px', margin:'0 0 10px' }}>
                Medical Escort Portal
              </h1>
              <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.4)', lineHeight:1.65, maxWidth:'300px', margin:'0 auto' }}>
                Authorized personnel only. Manage missions, patients, and documentation securely.
              </p>
            </div>
          )}

          <div style={{ position:'absolute', bottom:'24px', left:0, right:0, textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.2)', zIndex:2 }}>
            INTERNAL SYSTEM • RESTRICTED ACCESS
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div style={{
          width: isAuth ? '0' : '420px',
          flexShrink: 0,
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isAuth ? '0' : '40px 36px',
          overflow: 'hidden',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), padding 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isAuth ? 'translateX(100%)' : 'translateX(0)',
          // @ts-ignore
          transitionProperty: 'width, padding, transform',
        }}>
          <div style={{ width: '100%', maxWidth: '340px', whiteSpace: 'nowrap' }}>

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>
                Sign in to your account
              </h2>
              <p style={{ fontSize:'0.875rem', color:'#64748b', margin:0 }}>
                Enter your credentials to continue
              </p>
            </div>

            {searchParams.get('disabled') && (
              <div style={{ marginBottom:'18px', padding:'11px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#b91c1c', fontSize:'0.875rem', textAlign:'center' }}>
                Account disabled. Please contact your administrator.
              </div>
            )}

            <form onSubmit={handleLogin} suppressHydrationWarning>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontSize:'0.8125rem', fontWeight:600, color:'#374151' }}>
                  Email / Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  suppressHydrationWarning
                  style={{ width:'100%', padding:'11px 14px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9375rem', color:'#0f172a', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#1d4ed8'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontSize:'0.8125rem', fontWeight:600, color:'#374151' }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    suppressHydrationWarning
                    style={{ width:'100%', padding:'11px 48px 11px 14px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'0.9375rem', color:'#0f172a', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#1d4ed8'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', color: showPassword ? '#1d4ed8' : '#94a3b8' }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom:'16px', padding:'11px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#b91c1c', fontSize:'0.875rem', textAlign:'center' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width:'100%', padding:'13px', background: loading ? '#94a3b8' : '#1d3461', color:'#fff', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.9375rem', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:'0.02em', boxShadow:'0 4px 14px rgba(13,43,107,0.3)' }}
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>

            <p style={{ marginTop:'24px', textAlign:'center', fontSize:'0.72rem', color:'#94a3b8' }}>
              © 2025 Medical Escort. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

export default function Login() {
  return <Suspense fallback={<LoadingIcon />}><LoginContent /></Suspense>;
}
