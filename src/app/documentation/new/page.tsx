"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../documentation.module.css';

export default function NewDocumentationCustomer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [docServices, setDocServices] = useState<any[]>([]);
  const [genServiceId, setGenServiceId] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    contact_number: '',
    service_type: [] as string[]
  });

  useEffect(() => {
    async function loadConfig() {
      const { data: s } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      if (s) {
        setGenServiceId(s.id);
        const { data: c } = await supabaseAuth.from('customers').select('id, name, contact_number, service_type').eq('service', s.id);
        if (c) setCustomers(c);
      }
      if (s) setGenServiceId(s.id);

      const { data: d } = await supabaseAuth.from('doc_service_types').select('*');
      if (d) setDocServices(d);
    }
    loadConfig();
  }, []);

  const handleChange = (e: any) => {
    if (e.target.name === 'customer_id') {
      const selectedCust = customers.find(c => c.id === e.target.value);
      if (selectedCust) {
        setFormData({ 
          ...formData, 
          customer_id: selectedCust.id,
          name: selectedCust.name,
          contact_number: selectedCust.contact_number || '',
          service_type: selectedCust.service_type || []
        });
      } else {
        setFormData({ ...formData, customer_id: '', name: '', contact_number: '', service_type: [] });
      }
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, service: genServiceId };
      delete (payload as any).customer_id;
      // Clean up empty strings for database
      Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === '') {
          delete (payload as any)[key];
        }
      });
      
      if (!formData.customer_id) { alert("Please select a customer"); setLoading(false); return; }
      const { error } = await supabaseAuth.from('customers').update(payload).eq('id', formData.customer_id);
      if (error) throw error;
      
      router.push('/documentation');
    } catch (err: any) {
      alert("Error saving: " + err.message);
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
            <select name="customer_id" required value={formData.customer_id} onChange={handleChange}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={formData.contact_number || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
            <select multiple name="service_type" value={formData.service_type || []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFormData({...formData, service_type: selected});
            }} style={{ height: '160px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id} style={{ padding: '8px' }}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: '20px' }}>
            {loading ? 'Saving...' : 'Submit Request'}
          </button>
        </form>

      </div>
    </div>
  );
}
