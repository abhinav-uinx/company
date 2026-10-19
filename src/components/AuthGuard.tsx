'use client';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, logout, getCurrentUserPermissions } from '@/app/actions/auth';
import { supabaseAuth } from '@/lib/supabase';
import LoadingIcon from '@/components/LoadingIcon';

interface AuthContextType {
  username: string;
  role: string;
  name: string;
  status: string;
  permissions: string[];
  isFolderAllowed: (folderKey: string) => boolean;
  refreshPermissions: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  username: '',
  role: '',
  name: '',
  status: 'active',
  permissions: [],
  isFolderAllowed: () => false,
  refreshPermissions: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

import { subscribeToPermissionsChanges } from '@/lib/permissionsSync';

// System routes mapped to their authorization folder keys
const ROUTE_FOLDER_MAP: { prefix: string; folder: string; label: string }[] = [
  { prefix: '/customers', folder: 'customers', label: 'Customer Management' },
  { prefix: '/escorts', folder: 'escorts', label: 'Escort Missions' },
  { prefix: '/documentation', folder: 'general_services', label: 'General Services' },
  { prefix: '/invoices', folder: 'invoices', label: 'Invoice & Billing' },
  { prefix: '/vault', folder: 'vault', label: 'Document Vault' },
  { prefix: '/forms', folder: 'forms', label: 'Document Hub/forms' },
  { prefix: '/reports', folder: 'reports', label: 'Reports & Analytics' },
  { prefix: '/admin/reports', folder: 'reports', label: 'Cloud Admin Reports & Analytics' },
];

function checkFolderAllowed(folderKey: string, role: string, status: string, perms: string[]): boolean {
  if (role === 'admin') return true;
  if (status === 'disabled') return false;
  if (!perms || perms.length === 0) return false;
  return perms.includes(folderKey) ||
    (folderKey === 'customers' && perms.includes('patients')) ||
    (folderKey === 'documentation' && (perms.includes('general_services') || perms.includes('documentation'))) ||
    (folderKey === 'general_services' && (perms.includes('general_services') || perms.includes('documentation'))) ||
    (folderKey === 'vault' && (perms.includes('medical_records') || perms.includes('vault'))) ||
    (folderKey === 'reports' && (perms.includes('reports') || perms.includes('analytics'))) ||
    (folderKey === 'forms' && (perms.includes('forms') || perms.includes('hub')));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [liveToast, setLiveToast] = useState({ show: false, message: '', type: '' });
  
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [permissions, setPermissions] = useState<string[]>([]);

  const showToast = useCallback((message: string, type: string = 'disabled') => {
    setLiveToast({ show: true, message, type });
    setTimeout(() => {
      setLiveToast({ show: false, message: '', type: '' });
    }, 4500);
  }, []);

  const fetchAuthAndPermissions = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) {
        setUsername('');
        setRole('');
        setName('');
        setStatus('');
        setPermissions([]);
        return null;
      }

      const uName = (session.username as string) || '';
      const uRole = (session.role as string) || '';
      const dName = (session.name as string) || uName;

      setUsername(uName);
      setRole(uRole);
      setName(dName);

      // Fetch verified permissions from server action
      const permRes = await getCurrentUserPermissions();
      let currentPerms = permRes?.permissions || [];
      let currentStatus = permRes?.status || 'active';

      // Fast direct query on client for immediate cache refresh
      if (uRole === 'employee' && uName) {
        try {
          const { data: folderPermRows } = await supabaseAuth
            .from('employee_folder_permissions')
            .select('*')
            .eq('employee_iqama', uName);

          if (folderPermRows && folderPermRows.length > 0) {
            const row = folderPermRows[0];
            const directAllowed: string[] = [];
            const folderCols = ['customers', 'escorts', 'general_services', 'invoices', 'vault', 'reports', 'forms'];
            folderCols.forEach(col => {
              const val = row[col];
              if (val && val !== 'disabled') {
                directAllowed.push(col);
              }
            });
            if (directAllowed.includes('general_services') && !directAllowed.includes('documentation')) {
              directAllowed.push('documentation');
            }
            if (directAllowed.includes('documentation') && !directAllowed.includes('general_services')) {
              directAllowed.push('general_services');
            }
            if (directAllowed.length > 0) {
              currentPerms = directAllowed;
            }
          }
        } catch (e) {}
      }

      setStatus(currentStatus);
      setPermissions(currentPerms);

      return {
        username: uName,
        role: uRole,
        name: dName,
        status: currentStatus,
        permissions: currentPerms
      };
    } catch (err) {
      console.error('Error fetching auth & permissions:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const runAuthCheck = async () => {
      const isPublicRoute = pathname === '/login';
      const auth = await fetchAuthAndPermissions();

      if (isCancelled) return;

      if (!auth || !auth.username) {
        if (!isPublicRoute) {
          router.replace('/login');
        } else {
          setIsChecking(false);
        }
        return;
      }

      const { role: curRole, status: curStatus, permissions: curPerms } = auth;

      // Handle account disabled
      if (curStatus === 'disabled') {
        setIsChecking(false);
        return;
      }

      // Root and login redirects
      if (isPublicRoute || pathname === '/' || pathname === '/dashboard') {
        router.replace(curRole === 'admin' ? '/admin/dashboard' : '/user/dashboard');
        setIsChecking(false);
        return;
      }

      // Non-admins cannot access /admin (except /admin/reports if allowed)
      if (curRole !== 'admin' && pathname.startsWith('/admin')) {
        if (pathname.startsWith('/admin/reports')) {
          const allowed = checkFolderAllowed('reports', curRole, curStatus, curPerms);
          if (!allowed) {
            router.replace('/user/dashboard');
            showToast('Access Prohibited: You do not have permission to access Reports & Analytics.');
            setIsChecking(false);
            return;
          }
        } else {
          router.replace('/user/dashboard');
          setIsChecking(false);
          return;
        }
      }

      // Enforce Folder-Level Route Protection for employees
      if (curRole === 'employee') {
        const matched = ROUTE_FOLDER_MAP.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
        if (matched) {
          const isAllowed = checkFolderAllowed(matched.folder, curRole, curStatus, curPerms);
          if (!isAllowed) {
            router.replace('/user/dashboard');
            showToast(`Access Prohibited: You do not have permission to access the "${matched.label}" folder.`);
            setIsChecking(false);
            return;
          }
        }
      }

      setIsChecking(false);
    };

    runAuthCheck();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router, fetchAuthAndPermissions, showToast]);

  // Real-time synchronization without refreshing (Unified Multi-Tier Sync + 2.5s Heartbeat)
  useEffect(() => {
    if (!username) return;

    // Listen to Supabase Realtime broadcast, BroadcastChannel, localStorage, and focus events
    const unsubscribe = subscribeToPermissionsChanges((targetIqama) => {
      if (!targetIqama || targetIqama === 'all' || targetIqama === username) {
        fetchAuthAndPermissions();
      }
    });

    // Silent 2.5s heartbeat to guarantee zero-refresh consistency
    const heartbeatTimer = setInterval(() => {
      fetchAuthAndPermissions();
    }, 2500);

    return () => {
      unsubscribe();
      clearInterval(heartbeatTimer);
    };
  }, [username, fetchAuthAndPermissions]);

  // Instantly evict user from any restricted route if their permission is revoked while viewing
  useEffect(() => {
    if (role === 'employee' && !isChecking) {
      const matched = ROUTE_FOLDER_MAP.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
      if (matched) {
        const isAllowed = checkFolderAllowed(matched.folder, role, status, permissions);
        if (!isAllowed) {
          router.replace('/user/dashboard');
          showToast(`Access Prohibited: Your permission for "${matched.label}" was revoked.`);
        }
      }
    }
  }, [role, status, permissions, pathname, router, isChecking, showToast]);

  const isFolderAllowed = useCallback((folderKey: string): boolean => {
    return checkFolderAllowed(folderKey, role, status, permissions);
  }, [role, status, permissions]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isChecking) {
    return <LoadingIcon />;
  }

  const authContextValue: AuthContextType = {
    username,
    role,
    name,
    status,
    permissions,
    isFolderAllowed,
    refreshPermissions: fetchAuthAndPermissions as any,
    logout: handleLogout
  };

  const isAccountDisabled = Boolean(username) && status === 'disabled' && pathname !== '/login';

  return (
    <AuthContext.Provider value={authContextValue}>
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
          boxShadow: '0 4px 18px rgba(239, 68, 68, 0.45)',
          zIndex: 9999999,
          fontWeight: 600,
          border: liveToast.type === 'disabled' ? '1px solid #dc2626' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'toastDown 0.3s ease-out'
        }}>
          <span className="red-cross-badge" style={{ background: '#fff', color: '#ef4444', minWidth: '22px', height: '22px' }}>✕</span>
          <span>{liveToast.message}</span>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toastDown {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />

      {isAccountDisabled && (
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
              Your account has been disabled. Please contact an administrator.
            </p>
          </div>
        </div>
      )}

      <div style={{ pointerEvents: isAccountDisabled ? 'none' : 'auto', filter: isAccountDisabled ? 'blur(4px)' : 'none' }}>
        {children}
      </div>
    </AuthContext.Provider>
  );
}
