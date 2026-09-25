'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../patients.module.css';

export default function AddPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    dob: '',
    contact_number: '',
    email: '',
    address: '',
    passport_no: '',
    passport_expiry: '',
    visa_no: '',
    visa_type: '',
    visa_expiry: '',
    visa_country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_condition: '',
    current_hospital: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    // Handle empty date strings passing to date columns
    const cleanData = { ...formData };
    if (!cleanData.dob) delete (cleanData as any).dob;
    if (!cleanData.passport_expiry) delete (cleanData as any).passport_expiry;
    if (!cleanData.visa_expiry) delete (cleanData as any).visa_expiry;

    const { error } = await supabaseAuth.from('patients').insert([cleanData]);

    if (error) {
      setMsg({ text: 'Error adding patient: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Patient added successfully! Redirecting...', type: 'success' });
      setTimeout(() => {
        router.push('/patients');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Link href="/patients" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Patients
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Patient</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formSection}>Basic Information</div>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Nationality</label>
            <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Physical Address</label>
            <textarea name="address" rows={2} value={formData.address} onChange={handleChange}></textarea>
          </div>

          <div className={styles.formSection}>Passport & Visa Details</div>
          <div className={styles.formGroup}>
            <label>Passport Number</label>
            <input type="text" name="passport_no" value={formData.passport_no} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Passport Expiry</label>
            <input type="date" name="passport_expiry" value={formData.passport_expiry} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Number</label>
            <input type="text" name="visa_no" value={formData.visa_no} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Type</label>
            <input type="text" name="visa_type" value={formData.visa_type} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Country</label>
            <input type="text" name="visa_country" value={formData.visa_country} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Expiry</label>
            <input type="date" name="visa_expiry" value={formData.visa_expiry} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Medical & Emergency</div>
          <div className={styles.formGroup}>
            <label>Emergency Contact Name</label>
            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Emergency Contact Phone</label>
            <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Current Hospital</label>
            <input type="text" name="current_hospital" value={formData.current_hospital} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Medical Condition</label>
            <textarea name="medical_condition" rows={2} value={formData.medical_condition} onChange={handleChange}></textarea>
          </div>

          {msg.text && <div className={`${styles.message} ${styles[msg.type]}`}>{msg.text}</div>}
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Saving...' : 'Save Patient Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
