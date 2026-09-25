'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './escorts.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function EscortsList() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMission, setViewMission] = useState<any>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  async function fetchMissions() {
    setLoading(true);
    const { data, error } = await supabaseAuth
      .from('escort_missions')
      .select('*, patients(name)')
      .order('created_at', { ascending: false });
    
    if (data) {
      const empRes = await supabaseAuth.from('employees').select('iqama_number, name');
      const empMap: Record<string, string> = {};
      if (empRes.data) empRes.data.forEach(e => empMap[e.iqama_number] = e.name);
      const mapped = data.map(d => ({...d, employee_name: empMap[d.escort_employee_iqama]}));
      setMissions(mapped);
    } else {
      console.error(error);
    }
    setLoading(false);
  }

  const getStatusClass = (status: string) => {
    if (status === 'In-Transit') return styles.statusInTransit;
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'Returned') return styles.statusReturned;
    return styles.statusPending;
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabaseAuth.from('escort_missions').update({ status: newStatus }).eq('id', id);
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
          <Link href="/escorts/new" className={styles.addBtn}>
            <span className="material-symbols-outlined">flight_takeoff</span> Assign New Mission
          </Link>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Route</th>
                <th>Flight Date</th>
                <th>Assigned Escort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', position: 'relative', height: '200px' }}>
                    <LoadingIcon />
                  </td>
                </tr>
              ) : missions.length > 0 ? (
                missions.map(mission => (
                  <tr key={mission.id}>
                    <td style={{ fontWeight: 500 }}>{mission.patients?.name || 'Unknown Patient'}</td>
                    <td>{mission.from_country} {mission.layover_country ? '→ ' + mission.layover_country + ' ' : ''}→ {mission.to_country}</td>
                    <td>{mission.flight_date || 'TBD'}</td>
                    <td>{mission.employee_name || mission.escort_employee_iqama || 'Unassigned'}</td>
                    <td>
                      <select 
                        value={mission.status} 
                        onChange={(e) => updateStatus(mission.id, e.target.value)}
                        className={`${styles.statusBadge} ${getStatusClass(mission.status)}`}
                        style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In-Transit">In-Transit</option>
                        <option value="Completed">Completed</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setViewMission(mission)} style={{ color: '#0f172a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
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
          </table>
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
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Patient Name</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{viewMission.patients?.name || 'Unknown'}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Assigned Escort</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>{viewMission.employee_name || viewMission.escort_employee_iqama || 'Unassigned'}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Logistics */}
              <div>
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Travel Logistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Route</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewMission.from_country} {viewMission.layover_country ? '→ ' + viewMission.layover_country + ' ' : ''}→ {viewMission.to_country}</div>
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
    </>
  );
}