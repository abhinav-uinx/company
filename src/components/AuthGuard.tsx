'use client';
import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, logout } from '@/app/actions/auth';
import LoadingIcon from '@/components/LoadingIcon';

interface AuthContextType {
  username: string;
  role: string;
  name: string;
  status: string;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  username: '',
  role: '',
  name: '',
  status: 'active',
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Tab-level in-memory cache for instant client-side route transitions (<1ms)
let cachedAuth: { username: string; role: string; name: string; status: string } | null = null;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // If user auth is already cached in memory, start immediately with isChecking = false (0ms delay!)
  const [isChecking, setIsChecking] = useState(!cachedAuth);
  const [isDisabled, setIsDisabled] = useState(false);
  const [liveToast, setLiveToast] = useState({ show: false, message: '', type: '' });
  const [authState, setAuthState] = useState<AuthContextType>({
    username: cachedAuth?.username || '',
    role: cachedAuth?.role || '',
    name: cachedAuth?.name || '',
    status: cachedAuth?.status || 'active',
    logout: async () => {
      cachedAuth = null;
      await logout();
      router.replace('/login');
    },
  });

  useEffect(() => {
    const isPublicRoute = pathname === '/login';

    // 1. ULTRA-FAST IN-MEMORY PATH (<1ms):
    // If the user is already authenticated in this session, resolve routing instantly without network delays!
    if (cachedAuth && cachedAuth.username && cachedAuth.role) {
      const { role } = cachedAuth;

      if (isChecking) setIsChecking(false);

      if (pathname === '/' || pathname === '/dashboard') {
        router.replace(role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
        return;
      }
      if (isPublicRoute) {
        router.replace(role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
        return;
      }

      if (role !== 'admin' && pathname.startsWith('/admin')) {
        router.replace('/user/dashboard');
        return;
      }

      // Route transition is instant (<1ms) — ZERO loading screen!
      return;
    }

    // 2. COLD INITIAL LOAD (First page view / hard refresh only):
    let isCancelled = false;

    const checkAuth = async () => {
      const session = await getSession();
      if (isCancelled) return;

      const loggedInUser = session?.username as string | undefined;
      const role = session?.role as string | undefined;
      const displayName = (session?.name as string | undefined) || loggedInUser || '';

      if (!loggedInUser || !role) {
        cachedAuth = null;
        if (!isPublicRoute) {
          router.replace('/login');
        } else {
          setIsChecking(false);
        }
        return;
      }

      const verifiedAuth = {
        username: loggedInUser,
        role: role,
        name: displayName,
        status: 'active'
      };
      cachedAuth = verifiedAuth;

      setAuthState(prev => ({
        ...prev,
        ...verifiedAuth
      }));
      setIsChecking(false);

      if (isPublicRoute || pathname === '/' || pathname === '/dashboard') {
        router.replace(role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
      } else if (role !== 'admin' && pathname.startsWith('/admin')) {
        router.replace('/user/dashboard');
      }
    };

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router, isChecking]);

  if (isChecking) {
    return <LoadingIcon />;
  }

  return (
    <AuthContext.Provider value={authState}>
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
    </AuthContext.Provider>
  );
}
