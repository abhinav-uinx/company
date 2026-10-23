"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../documentation.module.css';

import {
  getGeneralServicesCache,
  getDocTypesCache,
  setDocTypesCache,
  updateRecordInCache
} from '../docCache';

export default function EditDocumentationRequest({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const [record, setRecord] = useState<any>(() => {
    return getGeneralServicesCache()?.find((r) => r.id === params.id) || null;
  });
  const [docServices, setDocServices] = useState<any[]>(() => {
    return getDocTypesCache() || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const r = getGeneralServicesCache()?.find((item) => item.id === params.id);
    const d = getDocTypesCache();
    return !r || !d || d.length === 0;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cachedTypes = getDocTypesCache();
        const [rRes, dRes] = await Promise.all([
          supabaseAuth
            .from('general_service_records')
            .select('*, customers(name)')
            .eq('id', params.id)
            .single(),
          !cachedTypes || cachedTypes.length === 0
            ? supabaseAuth.from('doc_service_types').select('*')
            : Promise.resolve({ data: cachedTypes })
        ]);

        if (rRes?.data) setRecord(rRes.data);
        if (dRes?.data) {
          setDocServices(dRes.data);
          setDocTypesCache(dRes.data);
        }
      } catch (err) {
        console.error("Error refreshing edit data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dbStatus = record.status === 'Done' ? 'Completed' : (record.status || 'Pending');
      const payload = {
        service_ids: record.service_ids,
        status: dbStatus,
        target_date: record.target_date || null,
        remarks: record.remarks || ''
      };

      // Instantly update cache so table reflects edits immediately
      updateRecordInCache(params.id, {
        ...payload,
        status: dbStatus
      });

      const { error } = await supabaseAuth.from('general_service_records').update(payload).eq('id', params.id);
      if (error) throw error;
      
      // Fast navigation without sluggish router.refresh()
      router.push('/documentation');
    } catch (err: any) {
      alert("Error saving: " + err.message);
      setSaving(false);
    }
  };

  if (loading && !record) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Preparing editor...
        </div>
      </div>
    );
  }
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
            <select 
              value={record.status === 'Completed' || record.status === 'Done' ? 'Done' : 'Pending'} 
              onChange={(e) => setRecord({...record, status: e.target.value})}
            >
              <option value="Pending">Pending</option>
              <option value="Done">Done</option>
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





