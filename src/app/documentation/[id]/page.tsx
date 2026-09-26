"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../documentation.module.css';

export default function EditDocumentationRequest({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docServices, setDocServices] = useState<any[]>([]);
  
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [rRes, dRes] = await Promise.all([
        supabaseAuth
          .from('general_service_records')
          .select('*, customers(name)')
          .eq('id', params.id)
          .single(),
        supabaseAuth.from('doc_service_types').select('*')
      ]);

      if (rRes.data) setRecord(rRes.data);
      if (dRes.data) setDocServices(dRes.data);
      setLoading(false);
    }
    if (params.id) loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        service_ids: record.service_ids,
        status: record.status,
        target_date: record.target_date || null,
        remarks: record.remarks || ''
      };
      const { error } = await supabaseAuth.from('general_service_records').update(payload).eq('id', params.id);
      if (error) throw error;
      
      router.push('/documentation');
      router.refresh(); // force clear Next.js cache
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!record) return <div className={styles.container}>Record not found.</div>;

  return (
    <div className={styles.container}>
      <Link href="/documentation" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Documentation
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Documentation Request</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
          
          <div className={styles.formGroup}>
            <label>Customer Name</label>
            <input type="text" disabled value={record.customers?.name || 'Unknown'} style={{ background: '#f8fafc', color: '#64748b' }} />
          </div>

          
          <div className={styles.formGroup}>
            <label style={{ marginBottom: '10px', display: 'block' }}>Documentation Services *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {docServices.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 400, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={(record.service_ids || []).includes(s.id)}
                    onChange={() => {
                      const ids = record.service_ids || [];
                      const newIds = ids.includes(s.id) ? ids.filter((i: string) => i !== s.id) : [...ids, s.id];
                      setRecord({ ...record, service_ids: newIds });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Status</label>
            <select value={record.status} onChange={(e) => setRecord({...record, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Target / Expiry Date (optional)</label>
            <input 
              type="date" 
              value={record.target_date || ''} 
              onChange={(e) => setRecord({...record, target_date: e.target.value})} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Remarks / Notes</label>
            <textarea 
              rows={4}
              value={record.remarks || ''} 
              onChange={(e) => setRecord({...record, remarks: e.target.value})} 
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" disabled={saving} className={styles.submitBtn} style={{ marginTop: '20px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
