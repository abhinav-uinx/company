'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../escorts.module.css';

export default function AddEscortMission() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasLayover, setHasLayover] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const [patients, setPatients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: '',
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
    async function loadDropdowns() {
      const [pRes, eRes] = await Promise.all([
        supabaseAuth.from('patients').select('id, name'),
        supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active')
      ]);
      if (pRes.data) setPatients(pRes.data);
      if (eRes.data) setEmployees(eRes.data);
    }
    loadDropdowns();
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    const cleanData = { ...formData };
    if (!cleanData.escort_required_date) delete (cleanData as any).escort_required_date;
    if (!cleanData.flight_date) delete (cleanData as any).flight_date;
    if (!cleanData.patient_id) {
      setMsg({ text: 'Please select a patient', type: 'error' });
      setLoading(false);
      return;
    }

    const { error } = await supabaseAuth.from('escort_missions').insert([cleanData]);

    if (error) {
      setMsg({ text: 'Error adding mission: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Mission assigned successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/escorts');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Link href="/escorts" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Missions
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Assign Escort Mission</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formSection}>Mission Details</div>
          
          <div className={styles.formGroup}>
            <label>Select Patient *</label>
            <select name="patient_id" required value={formData.patient_id} onChange={handleChange}>
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
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
              <input type="checkbox" checked={hasLayover} onChange={(e) => setHasLayover(e.target.checked)} />
              Flight has a layover
            </label>
          </div>
          {hasLayover && (
            <div className={styles.formGroup}>
              <label>Layover Country / City</label>
              <input type="text" name="layover_country" value={formData.layover_country} onChange={handleChange} placeholder="e.g. Dubai, UAE" />
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

          {msg.text && <div className={`${styles.message} ${msg.type === 'error' ? styles.error : styles.success}`}>{msg.text}</div>}
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Mission'}
          </button>
        </form>
      </div>
    </div>
  );
}
