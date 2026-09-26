"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../documentation.module.css';

export default function NewDocumentationRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [docServices, setDocServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    service_ids: [] as string[],
    target_date: '',
    remarks: '',
  });

  useEffect(() => {
    async function loadConfig() {
      // Get General Service customers
      const { data: s } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      if (s) {
        const { data: c } = await supabaseAuth.from('customers').select('id, name, contact_number').eq('service', s.id);
        if (c) setCustomers(c);
      }
      // Get doc service types
      const { data: d } = await supabaseAuth.from('doc_service_types').select('*');
      if (d) setDocServices(d);
    }
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) { alert('Please select a customer'); return; }
    if (formData.service_ids.length === 0) { alert('Please select at least one service'); return; }

    setLoading(true);
    try {
      const payload: any = {
        customer_id: formData.customer_id,
        service_ids: formData.service_ids,
        status: 'Pending',
      };
      if (formData.target_date) payload.target_date = formData.target_date;
      if (formData.remarks.trim()) payload.remarks = formData.remarks.trim();

      const { error } = await supabaseAuth.from('general_service_records').insert([payload]);
      if (error) throw error;

      router.push('/documentation');
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/documentation" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Documentation
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>New Documentation Request</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '40px' }}>

          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <select
              required
              value={formData.customer_id}
              onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          
          <div className={styles.formGroup}>
            <label style={{ marginBottom: '10px', display: 'block' }}>Documentation Services *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {docServices.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 400, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.service_ids.includes(s.id)}
                    onChange={() => {
                      const ids = formData.service_ids;
                      const newIds = ids.includes(s.id) ? ids.filter((i: string) => i !== s.id) : [...ids, s.id];
                      setFormData({ ...formData, service_ids: newIds });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {formData.service_ids.length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>Please select at least one service.</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Target / Expiry Date (optional)</label>
            <input
              type="date"
              value={formData.target_date}
              onChange={e => setFormData({ ...formData, target_date: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Remarks / Notes</label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional notes..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: '10px' }}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
