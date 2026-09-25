'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './documentation.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function DocumentationServices() {
  const [services, setServices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [viewService, setViewService] = useState<any>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    service_type: 'New Passport Creation',
    status: 'Applied',
    expiry_date: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      supabaseAuth.from('documentation_services').select('*, patients(name)').order('created_at', { ascending: false }),
      supabaseAuth.from('patients').select('id, name')
    ]);
    
    if (sRes.data) {
      setServices(sRes.data);
      // Check for docs expiring in next 30 days
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      const expiringCount = sRes.data.filter(s => s.expiry_date && new Date(s.expiry_date) < thirtyDays).length;
      setExpiringSoon(expiringCount);
    }
    if (pRes.data) setPatients(pRes.data);
    setLoading(false);
  }

  const getStatusClass = (status: string) => {
    if (status === 'In Process') return styles.statusInProcess;
    if (status === 'Completed') return styles.statusCompleted;
    if (status === 'Rejected') return styles.statusRejected;
    return styles.statusApplied;
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabaseAuth.from('documentation_services').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) return alert("Select a patient");
    const payload = { ...formData };
    if (!payload.expiry_date) delete (payload as any).expiry_date;

    await supabaseAuth.from('documentation_services').insert([payload]);
    setShowModal(false);
    fetchData();
  };

  return (
    <>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backBtn}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
        </Link>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Documentation Services</h1>
          <button onClick={() => setShowModal(true)} className={styles.addBtn}>
            <span className="material-symbols-outlined">add_task</span> New Service Request
          </button>
        </div>

        {expiringSoon > 0 && (
          <div className={styles.expiryAlert}>
            <span className="material-symbols-outlined">warning</span>
            Attention: {expiringSoon} document(s) are expiring within the next 30 days!
          </div>
        )}

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service Type</th>
                <th>Expiry Date</th>
                <th>Remarks</th>
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
              ) : services.length > 0 ? (
                services.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.patients?.name || 'Unknown'}</td>
                    <td>{s.service_type}</td>
                    <td>{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{s.remarks || '-'}</td>
                    <td>
                      <select 
                        value={s.status} 
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                        className={`${styles.statusBadge} ${getStatusClass(s.status)}`}
                        style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="In Process">In Process</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => setViewService(s)} style={{ color: '#0f172a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No services requested yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Request Documentation Service</h2>
              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <div className={styles.formGroup}>
                  <label>Patient *</label>
                  <select required value={formData.patient_id} onChange={(e) => setFormData({...formData, patient_id: e.target.value})}>
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Service Type *</label>
                  <select value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})}>
                    <option>New Passport Creation</option>
                    <option>Visa Renewal</option>
                    <option>Medical Report Attestation</option>
                    <option>Embassy Documentation</option>
                    <option>Ticket Booking Assistance</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Target Expiry Date (if applicable)</label>
                  <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Remarks / Notes</label>
                  <textarea rows={3} value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})}></textarea>
                </div>
                <div className={styles.btnGroup}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className={styles.btnSubmit}>Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {viewService && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="hide-scrollbar" style={{ background: '#fff', padding: '0', borderRadius: '16px', overflowY: 'auto', maxHeight: '90vh', width: '95%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#fff7ed', color: '#ea580c', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">folder_open</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Service Details</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Status: <span style={{ fontWeight: 600, color: '#ea580c' }}>{viewService.status}</span></p>
                </div>
              </div>
              <button onClick={() => setViewService(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>&times;</button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Name</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.125rem' }}>{viewService.patients?.name || 'Unknown'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Type</div>
                  <div style={{ color: '#0f172a', fontWeight: 500, marginTop: '4px' }}>{viewService.service_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Expiry</div>
                  <div style={{ color: '#0f172a', fontWeight: 500, marginTop: '4px' }}>{viewService.expiry_date ? new Date(viewService.expiry_date).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Remarks & Notes</div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#334155', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {viewService.remarks || 'No remarks provided.'}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 16px 16px', display: 'flex', boxShadow: '0 -10px 15px -3px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setViewService(null)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Close</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}