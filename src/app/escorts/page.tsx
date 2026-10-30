'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './escorts.module.css';
import TableSkeleton from '@/components/TableSkeleton';
import LoadingIcon from '@/components/LoadingIcon';
import { useAuth } from '@/components/AuthGuard';
import { MissionDetailsModal, PendingReasonsModal } from './components';
import { getCachedData, setCachedData } from '@/lib/appDataCache';

export default function EscortsList() {
  const { role, isFolderAllowed } = useAuth();
  const [missions, setMissions] = useState<any[]>(() => getCachedData('escort_missions') || []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedData('escort_missions')?.length);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewMission, setViewMission] = useState<any>(null);
  
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingMissionId, setPendingMissionId] = useState('');
  const [pendingReasons, setPendingReasons] = useState<string[]>([]);
  const [pendingReasonInput, setPendingReasonInput] = useState('');

  useEffect(() => {
    if (role === 'admin' || isFolderAllowed('escorts')) {
      const hasData = (getCachedData('escort_missions')?.length || 0) > 0;
      fetchMissions(!hasData);
    }
  }, [role, isFolderAllowed]);

  async function fetchMissions(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const [missionsRes, empRes] = await Promise.all([
        supabaseAuth
          .from('escort_missions')
          .select('*, customers!customer_id(name, current_hospital, passport)')
          .order('created_at', { ascending: false }),
        supabaseAuth.from('employees').select('iqama_number, name')
      ]);

      if (missionsRes.data) {
        const empMap: Record<string, string> = {};
        if (empRes.data) empRes.data.forEach((e: any) => empMap[e.iqama_number] = e.name);
        const mapped = missionsRes.data.map((d: any) => ({...d, employee_name: empMap[d.escort_employee_iqama]}));
        setMissions(mapped);
        setCachedData('escort_missions', mapped);
      } else if (missionsRes.error) {
        console.error(missionsRes.error);
        setErrorMsg(missionsRes.error.message);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusClass = (status: string) => {
    if (!status) return '';
    if (status === 'In-Transit') return styles.statusInTransit;
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'Returned') return styles.statusReturned;
    if (status.startsWith('Pending')) return styles.statusPending;
    return '';
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'Pending') {
      setPendingMissionId(id);
      const mission = missions.find(m => m.id === id);
      let existingReasons: string[] = [];
      if (mission && mission.reasons) {
         try {
           const parsed = JSON.parse(mission.reasons);
           if (Array.isArray(parsed)) existingReasons = parsed;
           else existingReasons = [mission.reasons];
         } catch(e) {
           existingReasons = [mission.reasons];
         }
      }
      setPendingReasons(existingReasons);
      setPendingReasonInput('');
      setShowPendingModal(true);
    } else {
      // Optimistic update
      setMissions(prev => {
        const next = prev.map(m => m.id === id ? { ...m, status: newStatus } : m);
        setCachedData('escort_missions', next);
        return next;
      });

      try {
        const { error } = await supabaseAuth.from('escort_missions').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to update status:', err);
        fetchMissions(false);
      }
    }
  };

  const savePendingReasons = async () => {
    let finalReasons = [...pendingReasons];
    if (pendingReasonInput.trim()) {
      finalReasons.push(pendingReasonInput.trim());
      setPendingReasonInput('');
    }
    const reasonsStr = JSON.stringify(finalReasons);

    // Optimistic update
    setMissions(prev => {
      const next = prev.map(m => m.id === pendingMissionId ? { ...m, status: 'Pending', reasons: reasonsStr } : m);
      setCachedData('escort_missions', next);
      return next;
    });
    setShowPendingModal(false);

    try {
      const { error } = await supabaseAuth.from('escort_missions').update({ 
        status: 'Pending', 
        reasons: reasonsStr 
      }).eq('id', pendingMissionId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to save pending reasons:', err);
      fetchMissions(false);
    }
  };

  if (role === 'employee' && !isFolderAllowed('escorts')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>Escort Missions</strong> folder. Please contact an administrator.
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
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard
        </Link>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Escort Missions</h1>
          {errorMsg && <div style={{color: 'red'}}>{errorMsg}</div>}
          <Link href="/escorts/new" className={styles.addBtn}>
            <span className="material-symbols-outlined">flight_takeoff</span> Assign New Mission
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.tableWrapper}><table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Route</th>
                <th>Flight Date</th>
                <th>Assigned Escort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={6} />
              ) : missions.length > 0 ? (
                missions.map(mission => (
                  <tr key={mission.id}>
                    <td style={{ fontWeight: 500 }}>{mission.customers?.name || 'Unknown Customer'}</td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                        <span>{mission.from_country || '-'}</span>
                        {mission.layover_country && (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>arrow_forward</span>
                            <span style={{ color: '#475569' }}>{mission.layover_country}</span>
                          </>
                        )}
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>arrow_forward</span>
                        <span>{mission.to_country || '-'}</span>
                      </div>
                    </td>
                    <td>{mission.flight_date || 'TBD'}</td>
                    <td>{mission.employee_name || mission.escort_employee_iqama || 'Unassigned'}</td>
                    <td>
                      {(() => {
                        const statusVal = mission.status || 'Pending';
                        const isPending = statusVal.startsWith('Pending');
                        const isInTransit = statusVal === 'In-Transit';
                        const isCompleted = statusVal === 'Completed';
                        const isReturned = statusVal === 'Returned';

                        let statusClass = styles.statusPending;
                        let statusIcon: React.ReactNode = null;
                        let displayLabel = 'Pending';

                        if (isInTransit) {
                          statusClass = styles.statusInTransit;
                          statusIcon = <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#2563eb' }}>flight_takeoff</span>;
                          displayLabel = 'In-Transit';
                        } else if (isCompleted) {
                          statusClass = styles.statusCompleted;
                          statusIcon = <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#059669', fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
                          displayLabel = 'Completed';
                        } else if (isReturned) {
                          statusClass = styles.statusReturned;
                          statusIcon = <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#7c3aed' }}>flight_land</span>;
                          displayLabel = 'Returned';
                        } else {
                          displayLabel = 'Pending';
                        }

                        let reasonCount = 0;
                        if (mission.reasons) {
                          try {
                            const parsed = JSON.parse(mission.reasons);
                            if (Array.isArray(parsed)) reasonCount = parsed.length;
                            else if (parsed) reasonCount = 1;
                          } catch {
                            reasonCount = 1;
                          }
                        }

                        return (
                          <div
                            className={`${styles.statusPill} ${statusClass}`}
                            title={`Click to change status${isPending && reasonCount > 0 ? ` (${reasonCount} reason${reasonCount > 1 ? 's' : ''} recorded)` : ''}`}
                          >
                            {statusIcon}
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.01em', lineHeight: 1 }}>
                              {displayLabel}
                              {isPending && reasonCount > 0 ? ` (${reasonCount})` : ''}
                            </span>
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: '13px',
                                opacity: 0.7,
                                marginLeft: '0px'
                              }}
                            >
                              expand_more
                            </span>

                            {/* Full-coverage native select overlay */}
                            <select
                              value={isInTransit ? 'In-Transit' : isCompleted ? 'Completed' : isReturned ? 'Returned' : 'Pending'}
                              onChange={(e) => updateStatus(mission.id, e.target.value)}
                              aria-label="Change status"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In-Transit">In-Transit</option>
                              <option value="Completed">Completed</option>
                              <option value="Returned">Returned</option>
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={async () => {
                          setViewMission(mission);
                          
                          // Fetch passport signed URLs
                          let passport_files: any[] = [];
                          let pList = mission.customers?.passport;
                          if (typeof pList === 'string') {
                            try { pList = JSON.parse(pList); } catch(e) {}
                          }
                          if (pList && Array.isArray(pList)) {
                            passport_files = await Promise.all(pList.map(async (file: any) => {
                              const { data: signed } = await supabaseAuth.storage.from('medical_escort').createSignedUrl(file.path, 3600);
                              return { ...file, url: signed?.signedUrl };
                            }));
                          }

                          // Fetch MEDIF form files
                          let medif_files: any[] = [];
                          if (mission.customer_id) {
                            const { data: mList } = await supabaseAuth.storage.from('medical_escort').list(`${mission.customer_id}/medif form`);
                            if (mList && mList.length > 0) {
                              medif_files = await Promise.all(mList.filter(f => f.name !== '.emptyFolderPlaceholder').map(async (f) => {
                                const path = `${mission.customer_id}/medif form/${f.name}`;
                                const { data: signed } = await supabaseAuth.storage.from('medical_escort').createSignedUrl(path, 3600);
                                return { name: f.name, path, url: signed?.signedUrl };
                              }));
                            }
                          }
                          
                          setViewMission((prev: any) => ({ ...prev, passport_files, medif_files }));
                        }} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 500 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#64748b' }}>visibility</span>
                          View
                        </button>
                        <Link href={`/escorts/${mission.id}`} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 500, textDecoration: 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No active missions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      </div>

      <MissionDetailsModal
        viewMission={viewMission}
        onClose={() => setViewMission(null)}
      />

      <PendingReasonsModal
        isOpen={showPendingModal}
        reasons={pendingReasons}
        onReasonsChange={setPendingReasons}
        onCancel={() => setShowPendingModal(false)}
        onSave={savePendingReasons}
      />
    </>
  );
}






