'use client';

import { useEffect, useState } from 'react';
import { getActiveSessions, terminateSession, getSession, getCurrentUserLoginInfo } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingIcon from '@/components/LoadingIcon';

export default function UserSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [terminateId, setTerminateId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const loadSessionData = async () => {
      const current = await getSession();
      if (!current) {
        router.replace('/login');
        return;
      }
      setCurrentSessionId(current.session_id as string);

      const [sessData, userDetails] = await Promise.all([
        getActiveSessions(),
        getCurrentUserLoginInfo()
      ]);

      setSessions(sessData || []);
      setUserInfo(userDetails);
      setLoading(false);
    };

    loadSessionData();
  }, [router]);

  const handleTerminate = (id: string) => {
    setTerminateId(id);
    setShowConfirmModal(true);
  };

  const confirmTerminate = async () => {
    if (!terminateId) return;
    setShowConfirmModal(false);
    await terminateSession(terminateId);
    setSessions(prev => prev.filter(s => s.id !== terminateId));
    if (terminateId === currentSessionId) {
      router.replace('/login');
    }
    setTerminateId(null);
  };

  if (loading) return <LoadingIcon />;

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Confirm Termination Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '14px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>Terminate Session</h3>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to terminate this session?
              <br /><br />
              {terminateId === currentSessionId ? (
                <strong style={{ color: '#ef4444' }}>This will immediately log you out from your current device.</strong>
              ) : (
                <span>This device will be immediately signed out and require login credentials again.</span>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTerminate}
                style={{ padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Terminate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: 800 }}>Account &amp; Active Sessions</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            View your current login profile and manage all devices with access to your account.
          </p>
        </div>
        <Link
          href="/user/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#4F5DFF',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            background: '#EEF1FF',
            padding: '8px 16px',
            borderRadius: '8px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> Back to Dashboard
        </Link>
      </div>

      {/* Login Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
        color: '#fff',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '32px',
        boxShadow: '0 10px 25px -5px rgba(11, 18, 32, 0.3)',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F5DFF 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(79, 93, 255, 0.35)',
            flexShrink: 0
          }}>
            {userInfo?.photo_url ? (
              <img src={userInfo.photo_url} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (userInfo?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>
                {userInfo?.name || 'Employee'}
              </h2>
              <span style={{
                background: 'rgba(79, 93, 255, 0.25)',
                color: '#A5B4FC',
                border: '1px solid rgba(165, 180, 252, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {userInfo?.role === 'admin' ? 'Administrator' : 'Employee Portal'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
              Iqama / Username: <strong style={{ color: '#E2E8F0' }}>{userInfo?.username}</strong>
              {userInfo?.job_title ? ` · ${userInfo.job_title}` : ''}
              {userInfo?.department ? ` (${userInfo.department})` : ''}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 600 }}>{userInfo?.email || 'Not Provided'}</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</span>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 600 }}>{userInfo?.phone_number || 'Not Provided'}</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current IP Address</span>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 600 }}>{currentSession?.ip_address || '127.0.0.1'}</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Location</span>
            <span style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: 600 }}>{currentSession?.location || 'Local Network'}</span>
          </div>
        </div>
      </div>

      {/* Active Sessions List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#4F5DFF', fontSize: '22px' }}>devices</span>
          Active Devices ({sessions.length})
        </h2>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Auto-synchronized with authentication
        </span>
      </div>

      {/* Sessions Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sessions.map(session => {
          const isCurrent = session.id === currentSessionId;
          const isMobile = (session.device || '').toLowerCase().includes('mobile') ||
                           (session.os || '').toLowerCase().includes('ios') ||
                           (session.os || '').toLowerCase().includes('android');

          return (
            <div
              key={session.id}
              style={{
                background: '#fff',
                border: isCurrent ? '1.5px solid #818CF8' : '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isCurrent ? '0 4px 14px rgba(79, 93, 255, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  background: isCurrent ? '#EEF2FF' : '#F8FAFC',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCurrent ? '#4F5DFF' : '#64748B',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                    {isMobile ? 'smartphone' : 'computer'}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0F172A', fontWeight: 700 }}>
                      {session.browser || 'Browser'} on {session.os || 'OS'}
                    </h3>
                    {isCurrent && (
                      <span style={{
                        background: '#DCFCE7',
                        color: '#15803D',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        border: '1px solid #BBF7D0'
                      }}>
                        Current Session
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>
                      <strong>IP:</strong> {session.ip_address} &middot; <strong>Location:</strong> {session.location || 'Unknown'}
                    </div>
                    <div>
                      <strong>Logged In:</strong> {new Date(session.created_at).toLocaleString()} &middot; <strong>Last Active:</strong> {new Date(session.last_active).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleTerminate(session.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                  {isCurrent ? 'Sign Out' : 'Terminate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
