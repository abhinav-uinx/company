'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../invoices.module.css';

export default function CreateInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patient_id: '',
    mission_id: '',
    medical_escort_charges: 0,
    ticket_charges: 0,
    documentation_charges: 0,
    other_expenses: 0,
    tax_vat_percent: 0,
    discount: 0,
    advance_payment: 0
  });

  useEffect(() => {
    async function loadData() {
      const [pRes, mRes] = await Promise.all([
        supabaseAuth.from('patients').select('id, name'),
        supabaseAuth.from('escort_missions').select('id, patient_id, from_country, to_country')
      ]);
      if (pRes.data) setPatients(pRes.data);
      if (mRes.data) setMissions(mRes.data);
    }
    loadData();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('id') ? value : parseFloat(value) || 0
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.medical_escort_charges + formData.ticket_charges + formData.documentation_charges + formData.other_expenses;
    const vatAmount = subtotal * (formData.tax_vat_percent / 100);
    const total_amount = subtotal + vatAmount - formData.discount;
    const balance_amount = total_amount - formData.advance_payment;
    
    let status = 'Unpaid';
    if (formData.advance_payment > 0 && formData.advance_payment < total_amount) status = 'Partially Paid';
    if (balance_amount <= 0 && total_amount > 0) status = 'Paid';

    return { subtotal, vatAmount, total_amount, balance_amount, status };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) return alert('Select Patient');

    setLoading(true);
    const payload = {
      ...formData,
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
      balance_amount: totals.balance_amount,
      status: totals.status,
      mission_id: formData.mission_id || null
    };

    const { error, data } = await supabaseAuth.from('invoices').insert([payload]).select().single();
    
    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    } else {
      if (formData.advance_payment > 0) {
        await supabaseAuth.from('payment_history').insert([{
          invoice_id: data.id,
          amount: formData.advance_payment,
          payment_method: 'Initial Advance'
        }]);
      }
      router.push('/invoices');
    }
  };

  const filteredMissions = formData.patient_id ? missions.filter(m => m.patient_id === formData.patient_id) : [];

  return (
    <div className={styles.container}>
      <Link href="/invoices" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Invoices
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Generate New Invoice</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formSection}>Client Details</div>
          
          <div className={styles.formGroup}>
            <label>Select Patient *</label>
            <select name="patient_id" required value={formData.patient_id} onChange={handleChange}>
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Link Escort Mission (Optional)</label>
            <select name="mission_id" value={formData.mission_id} onChange={handleChange}>
              <option value="">-- No Mission Linked --</option>
              {filteredMissions.map(m => <option key={m.id} value={m.id}>{m.from_country} → {m.to_country}</option>)}
            </select>
          </div>

          <div className={styles.formSection}>Charges</div>
          
          <div className={styles.formGroup}>
            <label>Medical Escort Charges ($)</label>
            <input type="number" step="0.01" name="medical_escort_charges" value={formData.medical_escort_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Ticket Charges ($)</label>
            <input type="number" step="0.01" name="ticket_charges" value={formData.ticket_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Documentation Charges ($)</label>
            <input type="number" step="0.01" name="documentation_charges" value={formData.documentation_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Other Expenses ($)</label>
            <input type="number" step="0.01" name="other_expenses" value={formData.other_expenses} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Adjustments & Payments</div>

          <div className={styles.formGroup}>
            <label>Tax / VAT (%)</label>
            <input type="number" step="0.01" name="tax_vat_percent" value={formData.tax_vat_percent} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Discount Amount ($)</label>
            <input type="number" step="0.01" name="discount" value={formData.discount} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Advance Payment Received ($)</label>
            <input type="number" step="0.01" name="advance_payment" value={formData.advance_payment} onChange={handleChange} />
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>VAT ({formData.tax_vat_percent}%):</span>
              <span>+ ${totals.vatAmount.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Discount:</span>
              <span>- ${formData.discount.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total Amount:</span>
              <span>${totals.total_amount.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow} style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
              <span>Advance Paid:</span>
              <span style={{ color: '#166534', fontWeight: 600 }}>${formData.advance_payment.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Balance Due:</span>
              <span style={{ color: totals.balance_amount > 0 ? '#ef4444' : '#0f172a' }}>
                ${totals.balance_amount.toFixed(2)}
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
