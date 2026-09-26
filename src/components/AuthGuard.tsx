'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, checkAuthStatus, logout } from '@/app/actions/auth';
import LoadingIcon from '@/components/LoadingIcon';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [liveToast, setLiveToast] = useState({show: false, message: '', type: ''});
  const currentStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const isPublicRoute = pathname === '/login';

    const checkAuth = async () => {
      const session = await getSession();
      const loggedInUser = session?.username;
      const role = session?.role;

      if (!loggedInUser || !role) {
        if (!isPublicRoute) {
          router.replace('/login');
        } else {
          setIsChecking(false);
        }
        return;
      }

      // Check permissions on the server
      const data = await checkAuthStatus(loggedInUser as string, role as string);
      
      if (data) {
        currentStatusRef.current = data.status;
      }

      if (data && data.status === 'disabled') {
        setIsDisabled(true);
        await logout();
        setIsChecking(false);
        return;
      }

      if (isPublicRoute || pathname === '/') {
        router.replace('/dashboard');
      } else {
        let allowed = true;
        if (role !== 'admin') {
          const perms = data?.permissions || [];
          if (pathname.startsWith('/directory')) allowed = false;
          else if (pathname.startsWith('/customers') && !perms.includes('customers')) allowed = false;
          else if (pathname.startsWith('/escorts') && !perms.includes('escorts')) allowed = false;
          else if (pathname.startsWith('/documentation') && !perms.includes('documentation')) allowed = false;
          else if (pathname.startsWith('/invoices') && !perms.includes('invoices')) allowed = false;
          else if (pathname.startsWith('/reports') && !perms.includes('reports')) allowed = false;
        }

        if (!allowed) {
          router.replace('/dashboard');
        } else {
          setIsChecking(false);
        }
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  // Live Status Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = async () => {
      const session = await getSession();
      if (!session) return;
      const { username, role } = session;

      interval = setInterval(async () => {
        const data = await checkAuthStatus(username as string, role as string);
        if (data && currentStatusRef.current && data.status !== currentStatusRef.current) {
          const newStatus = data.status;
          currentStatusRef.current = newStatus;

          let msg = 'Permission changed to Full Access';
          if (newStatus === 'disabled') {
            msg = 'Account Disabled. Please contact admin.';
            setIsDisabled(true);
            await logout();
          } else if (newStatus === 'view_only') {
            msg = 'Permission changed to View Only';
          }
          
          setLiveToast({ show: true, message: msg, type: newStatus });
          setTimeout(() => {
            setLiveToast(t => ({ ...t, show: false }));
          }, 4000);
        } else if (data && !currentStatusRef.current) {
           currentStatusRef.current = data.status;
        }
      }, 5000); // Polling every 5 seconds to reduce server load
    };

    startPolling();
    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return <LoadingIcon />;
  }

  return (
    <>
      {liveToast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: liveToast.type === 'disabled' ? '#ef4444' : '#ffffff',
          color: liveToast.type === 'disabled' ? '#ffffff' : '#000000',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999999,
          fontWeight: 600,
          border: liveToast.type === 'disabled' ? 'none' : '1px solid #e2e8f0',
          animation: 'toastDown 0.3s ease-out'
        }}>
          {liveToast.message}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toastDown {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />

      {isDisabled && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', padding: '40px', borderRadius: '12px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '60px', height: '60px', background: '#fef2f2',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>block</span>
            </div>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '1.5rem' }}>Account Disabled</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>
              Account disabled, please contact admin.
            </p>
          </div>
        </div>
      )}
      <div style={{ pointerEvents: isDisabled ? 'none' : 'auto', filter: isDisabled ? 'blur(4px)' : 'none' }}>
        {children}
      </div>
    </>
  );
}
