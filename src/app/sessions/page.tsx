'use client';
import { useEffect, useState } from 'react';
import { getActiveSessions, terminateSession, getSession } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingIcon from '@/components/LoadingIcon';

export default function SessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            const current = await getSession();
            if (!current) {
                router.replace('/login');
                return;
            }
            setCurrentSessionId(current.session_id as string);
            const data = await getActiveSessions();
            setSessions(data);
            setLoading(false);
        };
        fetchSessions();
    }, [router]);

    const handleTerminate = async (id: string) => {
        const ok = confirm('Are you sure you want to terminate this session?');
        if (!ok) return;
        
        await terminateSession(id);
        setSessions(s => s.filter(x => x.id !== id));
        if (id === currentSessionId) {
            router.replace('/login');
        }
    };

    if (loading) return <LoadingIcon />;

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Active Sessions</h1>
                <Link href="/dashboard" style={{ color: '#4F5DFF', textDecoration: 'none', fontWeight: 500 }}>
                    &larr; Back to Dashboard
                </Link>
            </div>
            
            <p style={{ color: '#64748b', marginBottom: '30px' }}>
                Manage your active sessions across different devices and browsers. You can terminate any unrecognized sessions here.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {sessions.map(session => (
                    <div key={session.id} style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ 
                                width: '50px', height: '50px', 
                                background: '#f8fafc', borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                                    {session.device.toLowerCase().includes('mobile') || session.os.toLowerCase().includes('ios') || session.os.toLowerCase().includes('android') ? 'smartphone' : 'computer'}
                                </span>
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {session.browser} on {session.os}
                                    {session.id === currentSessionId && (
                                        <span style={{ 
                                            background: '#dcfce7', color: '#166534', 
                                            fontSize: '12px', padding: '2px 8px', 
                                            borderRadius: '999px', fontWeight: 600 
                                        }}>
                                            Current Session
                                        </span>
                                    )}
                                </h3>
                                <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div><strong>IP:</strong> {session.ip_address} &middot; <strong>Location:</strong> {session.location}</div>
                                    <div><strong>Started:</strong> {new Date(session.created_at).toLocaleString()}</div>
                                    <div><strong>Last Active:</strong> {new Date(session.last_active).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleTerminate(session.id)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
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
                            Terminate
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
