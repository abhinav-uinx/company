'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './escorts.module.css';
import TableSkeleton from '@/components/TableSkeleton';
import LoadingIcon from '@/components/LoadingIcon';

export default function EscortsList() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewMission, setViewMission] = useState<any>(null);
  
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingMissionId, setPendingMissionId] = useState('');
  const [pendingReasons, setPendingReasons] = useState<string[]>([]);
  const [pendingReasonInput, setPendingReasonInput] = useState('');

  useEffect(() => {
    fetchMissions();
  }, []);

  async function fetchMissions() {
    setLoading(true);
    const { data, error } = await supabaseAuth
      .from('escort_missions')
      .select('*, customers!customer_id(name, current_hospital, passport)')
      .order('created_at', { ascending: false });
    
    if (data) {
      const empRes = await supabaseAuth.from('employees').select('iqama_number, name');
      const empMap: Record<string, string> = {};
      if (empRes.data) empRes.data.forEach(e => empMap[e.iqama_number] = e.name);
      const mapped = data.map(d => ({...d, employee_name: empMap[d.escort_employee_iqama]}));
      setMissions(mapped);
    } else {
      console.error(error);
      if (error) setErrorMsg(error.message);
    }
    setLoading(false);
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
      await supabaseAuth.from('escort_missions').update({ status: newStatus }).eq('id', id);
      fetchMissions();
    }
  };

  const savePendingReasons = async () => {
    let finalReasons = [...pendingReasons];
    if (pendingReasonInput.trim()) {
      finalReasons.push(pendingReasonInput.trim());
      setPendingReasonInput('');
    }
    await supabaseAuth.from('escort_missions').update({ 
      status: 'Pending', 
      reasons: JSON.stringify(finalReasons) 
    }).eq('id', pendingMissionId);
    setShowPendingModal(false);
    fetchMissions();
  };

  return (
    <>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backBtn}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
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
                    <td>{mission.from_country} {mission.layover_country ? 'â†’ ' + mission.layover_country + ' ' : ''}â†’ {mission.to_country}</td>
                    <td>{mission.flight_date || 'TBD'}</td>
                    <td>{mission.employee_name || mission.escort_employee_iqama || 'Unassigned'}</td>
                    <td>
                      <select 
                        value={mission.status || ''} 
                        onChange={(e) => updateStatus(mission.id, e.target.value)}
                        className={`${styles.statusBadge} ${getStatusClass(mission.status || '')}`}
                        style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '20px', width: '100%' }}
                      >
                        <option value="" disabled style={{background: 'white', color: 'black'}}>-- Status --</option>
                        <option value="Pending" style={{background: 'white', color: 'black'}}>Pending</option>
                        <option value="In-Transit" style={{background: 'white', color: 'black'}}>In-Transit</option>
                        <option value="Completed" style={{background: 'white', color: 'black'}}>Completed</option>
                        <option value="Returned" style={{background: 'white', color: 'black'}}>Returned</option>
                      </select>
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
                        }} style={{ color: '#0f172a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                        <Link href={`/escorts/${mission.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>Edit</Link>
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

      {viewMission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="hide-scrollbar" style={{ background: '#fff', padding: '0', borderRadius: '16px', width: '95%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">flight_takeoff</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Mission Details</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Status: <span style={{ fontWeight: 600, color: '#2563eb' }}>{viewMission.status}</span></p>
                </div>
              </div>
              <button onClick={() => setViewMission(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>&times;</button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Section 1: People */}
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Assignment Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Customer Name</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{viewMission.customers?.name || 'Unknown'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Assigned Escort</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{viewMission.employee_name || viewMission.escort_employee_iqama || 'Unassigned'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Current Hospital</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{viewMission.customers?.current_hospital || '-'}</div>
                  </div>
                  
                  {viewMission.reasons && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Reasons / Notes</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(() => {
                          let rList = [];
                          try {
                            const parsed = JSON.parse(viewMission.reasons);
                            if (Array.isArray(parsed)) rList = parsed;
                            else rList = [viewMission.reasons];
                          } catch(e) {
                            rList = [viewMission.reasons];
                          }
                          return rList.map((r: string, i: number) => (
                            <div key={i} style={{ background: '#fef08a', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', color: '#854d0e', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                              {r}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                  {viewMission.passport_files && viewMission.passport_files.length > 0 && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Passport Preview</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {viewMission.passport_files.map((file: any, idx: number) => (
                          <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                            {file.name.toLowerCase().endsWith('.pdf') ? (
                              <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#2563eb', padding: '10px' }}>
                                <span className="material-symbols-outlined">picture_as_pdf</span>
                                <span>{file.name}</span>
                              </a>
                            ) : (
                              <a href={file.url} target="_blank" rel="noreferrer">
                                <img src={file.url} alt="Passport" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewMission.medif_files && viewMission.medif_files.length > 0 && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>MEDIF Form Preview</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {viewMission.medif_files.map((file: any, idx: number) => (
                          <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                            {file.name.toLowerCase().endsWith('.pdf') ? (
                              <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#16a34a', padding: '10px' }}>
                                <span className="material-symbols-outlined">description</span>
                                <span>{file.name}</span>
                              </a>
                            ) : (
                              <a href={file.url} target="_blank" rel="noreferrer">
                                <img src={file.url} alt="MEDIF" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Logistics */}
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Travel Logistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Route</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.from_country} {viewMission.layover_country ? 'â†’ ' + viewMission.layover_country + ' ' : ''}â†’ {viewMission.to_country}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Required Date</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.escort_required_date || '-'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Boarding / Pick-up</div>
                    <div style={{ color: '#0f172a' }}>{viewMission.boarding_details || '-'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Destination / Hospital</div>
                    <div style={{ color: '#0f172a' }}>{viewMission.destination_address || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Flight Info */}
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Flight Details & Costs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Airline</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.airline || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Flight No.</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.flight_no || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Flight Date</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.flight_date || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PNR</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.pnr || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ticket Cost</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>${viewMission.ticket_cost || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Approx Total Cost</div>
                    <div style={{ color: '#16a34a', fontWeight: 600 }}>${viewMission.approx_cost || 0}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 16px 16px', display: 'flex', boxShadow: '0 -10px 15px -3px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10, justifyContent: 'flex-end', gap: '12px' }}>
              <Link href={`/escorts/${viewMission.id}`} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#0f172a', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>Edit Mission</Link>
              <button onClick={() => setViewMission(null)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>

          </div>
        </div>
      )}

      {showPendingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#0f172a' }}>Enter Pending Reasons</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '32px' }}>
              {pendingReasons.map((r, i) => (
                <div key={i} style={{ background: '#fef08a', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#854d0e' }}>
                  <span>{r}</span>
                  <button onClick={() => setPendingReasons(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#854d0e', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                </div>
              ))}
            </div>

            <input 
              type="text" 
              value={pendingReasonInput} 
              onChange={e => setPendingReasonInput(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (pendingReasonInput.trim()) {
                    setPendingReasons(prev => [...prev, pendingReasonInput.trim()]);
                    setPendingReasonInput('');
                  }
                }
              }} 
              placeholder="Type a reason and press Enter..." 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowPendingModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#0f172a', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={savePendingReasons} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Save Reasons</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






