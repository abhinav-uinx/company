'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../escorts.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function EditEscortMission() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [hasLayover, setHasLayover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    from_country: '',
    to_country: '',
    layover_country: '',
    boarding_details: '',
    destination_address: '',
    escort_required_date: '',
    flight_no: '',
    pnr: '',
    flight_date: '',
    airline: '',
    ticket_cost: 0,
    escort_employee_iqama: '',
    approx_cost: 0,
    status: 'Pending'
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pRes, eRes, mRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name, services!inner(name)').eq('services.name', 'Medical Escort'),
        supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active'),
        supabaseAuth.from('escort_missions').select('*').eq('id', id).single()
      ]);
      
      if (pRes.data) setCustomers(pRes.data);
      if (eRes.data) setEmployees(eRes.data);
      if (mRes.data) {
        setFormData({
          customer_id: mRes.data.customer_id || '',
          from_country: mRes.data.from_country || '',
          to_country: mRes.data.to_country || '',
          layover_country: mRes.data.layover_country || '',
          boarding_details: mRes.data.boarding_details || '',
          destination_address: mRes.data.destination_address || '',
          escort_required_date: mRes.data.escort_required_date || '',
          flight_no: mRes.data.flight_no || '',
          pnr: mRes.data.pnr || '',
          flight_date: mRes.data.flight_date || '',
          airline: mRes.data.airline || '',
          ticket_cost: mRes.data.ticket_cost || 0,
          escort_employee_iqama: mRes.data.escort_employee_iqama || '',
          approx_cost: mRes.data.approx_cost || 0,
          status: mRes.data.status || 'Pending'
        });
      }
      setLoading(false);
    }
    if (id) loadData();
  }, [id]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    const cleanData = { ...formData };
    if (!hasLayover) delete (cleanData as any).layover_country;
    if (!cleanData.escort_required_date) delete (cleanData as any).escort_required_date;
    if (!cleanData.flight_date) delete (cleanData as any).flight_date;

    const { error } = await supabaseAuth.from('escort_missions').update(cleanData).eq('id', id);

    if (error) {
      setMsg({ text: 'Error updating mission: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Mission updated successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/escorts');
      }, 1500);
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.container}><LoadingIcon /></div>;

  return (
    <div className={styles.container}>
      <Link href="/escorts" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Missions
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Escort Mission</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formSection}>Mission Details</div>
          
          <div className={styles.formGroup}>
            <label>Select Customer *</label>
            <select name="customer_id" required value={formData.customer_id} onChange={handleChange}>
              <option value="">-- Choose Customer --</option>
              {customers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Assign Escort (Employee)</label>
            <select name="escort_employee_iqama" value={formData.escort_employee_iqama} onChange={handleChange}>
              <option value="">-- Unassigned --</option>
              {employees.map(e => (
                <option key={e.iqama_number} value={e.iqama_number}>{e.name} ({e.iqama_number})</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>From Country</label>
            <input type="text" name="from_country" value={formData.from_country} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>To Country</label>
            <input type="text" name="to_country" value={formData.to_country} onChange={handleChange} />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
              <input type="checkbox" checked={hasLayover} onChange={(e) => {
                setHasLayover(e.target.checked);
                if (!e.target.checked) setFormData({...formData, layover_country: ''});
              }} />
              Flight has a layover
            </label>
          </div>
          {hasLayover && (
            <div className={styles.formGroup}>
              <label>Layover Country / City</label>
              <input type="text" name="layover_country" value={formData.layover_country || ''} onChange={handleChange} placeholder="e.g. Dubai, UAE" />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Required Date</label>
            <input type="date" name="escort_required_date" value={formData.escort_required_date} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Approximate Total Cost ($)</label>
            <input type="number" step="0.01" name="approx_cost" value={formData.approx_cost} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Flight & Logistics</div>

          <div className={styles.formGroup}>
            <label>Airline</label>
            <input type="text" name="airline" value={formData.airline} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Flight No</label>
            <input type="text" name="flight_no" value={formData.flight_no} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Flight Date</label>
            <input type="date" name="flight_date" value={formData.flight_date} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>PNR</label>
            <input type="text" name="pnr" value={formData.pnr} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Ticket Cost ($)</label>
            <input type="number" step="0.01" name="ticket_cost" value={formData.ticket_cost} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Address Details</div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Boarding / Pick-up Details</label>
            <textarea name="boarding_details" rows={2} value={formData.boarding_details} onChange={handleChange}></textarea>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Destination Address / Hospital</label>
            <textarea name="destination_address" rows={2} value={formData.destination_address} onChange={handleChange}></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Pending">Pending</option>
              <option value="In-Transit">In-Transit</option>
              <option value="Completed">Completed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            {msg.text && <div style={{ padding: '10px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '15px' }}>{msg.text}</div>}
            <button type="submit" className={styles.submitBtn} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving Changes...' : 'Update Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
