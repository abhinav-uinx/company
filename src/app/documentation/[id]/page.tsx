"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../documentation.module.css';

export default function EditDocumentationCustomer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docServices, setDocServices] = useState<any[]>([]);
  
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [cRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('*').eq('id', params.id).single(),
        supabaseAuth.from('doc_service_types').select('*')
      ]);

      if (cRes.data) setCustomer(cRes.data);
      if (dRes.data) setDocServices(dRes.data);
      setLoading(false);
    }
    if (params.id) loadData();
  }, [params.id]);

  const handleChange = (e: any) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...customer };
      const { error } = await supabaseAuth.from('customers').update(payload).eq('id', params.id);
      if (error) throw error;
      
      router.push('/documentation');
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!customer) return <div className={styles.container}>Customer not found.</div>;

  return (
    <div className={styles.container}>
      <Link href="/documentation" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Documentation
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit General Service Customer</h1>
      </div>

      <div className={styles.card}>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
          
          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <input type="text" name="name" required value={customer.name || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={customer.contact_number || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
            <select multiple name="service_type" value={customer.service_type || []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setCustomer({...customer, service_type: selected});
            }} style={{ height: '160px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id} style={{ padding: '8px' }}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className={styles.submitBtn} style={{ marginTop: '20px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

      </div>
    </div>
  );
}
