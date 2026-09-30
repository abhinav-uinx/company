'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../../invoices.module.css';

export default function EditInvoice() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [docServiceTypes, setDocServiceTypes] = useState<any[]>([]);
  const [customerServices, setCustomerServices] = useState<string[]>([]);
  const [showOtherExpenses, setShowOtherExpenses] = useState(false);
  const [selectedOtherExpenses, setSelectedOtherExpenses] = useState<string[]>([]);
  const [otherExpensesPrices, setOtherExpensesPrices] = useState<Record<string, number>>({});
  const [fullAmountReceived, setFullAmountReceived] = useState(false);
  const [useCurrentDate, setUseCurrentDate] = useState(true);
  const [customDate, setCustomDate] = useState('');

  const fixedServices = ['Ambulance Services (SAUDI)', 'Ambulance Service (INDIA)', 'Portable Ventilator'];

  const [formData, setFormData] = useState({
    customer_id: '',
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
      const [pRes, mRes, invRes, dRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name'),
        supabaseAuth.from('escort_missions').select('id, customer_id, from_country, to_country'),
        supabaseAuth.from('invoices').select('*').eq('id', id).single(),
        supabaseAuth.from('doc_service_types').select('*')
      ]);
      if (pRes.data) setCustomers(pRes.data);
      if (mRes.data) setMissions(mRes.data);
      if (dRes.data) setDocServiceTypes(dRes.data);
      
      if (invRes.data) {
        if (invRes.data.other_expenses_details && invRes.data.other_expenses_details.length > 0) {
          setShowOtherExpenses(true);
          if (typeof invRes.data.other_expenses_details[0] === 'object') {
            setSelectedOtherExpenses(invRes.data.other_expenses_details.map((x: any) => x.name));
            const prices: Record<string, number> = {};
            invRes.data.other_expenses_details.forEach((x: any) => { prices[x.name] = x.amount; });
            setOtherExpensesPrices(prices);
          } else {
            setSelectedOtherExpenses(invRes.data.other_expenses_details);
          }
        }
        setFormData({
          customer_id: invRes.data.customer_id || '',
          mission_id: invRes.data.mission_id || '',
          medical_escort_charges: invRes.data.medical_escort_charges || 0,
          ticket_charges: invRes.data.ticket_charges || 0,
          documentation_charges: invRes.data.documentation_charges || 0,
          other_expenses: invRes.data.other_expenses || 0,
          tax_vat_percent: invRes.data.tax_vat_percent || 0,
          discount: invRes.data.discount || 0,
          advance_payment: invRes.data.advance_payment || 0
        });
        
        if (invRes.data.created_at) {
          setCustomDate(new Date(invRes.data.created_at).toISOString().split('T')[0]);
          setUseCurrentDate(false);
        }
      }
      setDataLoading(false);
    }
    loadData();
  }, [id]);

  useEffect(() => {
    async function loadCustomerGeneralServices() {
      if (!formData.customer_id) {
        setCustomerServices([]);
        return;
      }
      const { data } = await supabaseAuth.from('general_service_records').select('service_ids').eq('customer_id', formData.customer_id);
      if (data && data.length > 0) {
        let allIds: string[] = [];
        data.forEach((r: any) => { if (r.service_ids) allIds = [...allIds, ...r.service_ids]; });
        setCustomerServices(Array.from(new Set(allIds)));
      } else {
        setCustomerServices([]);
      }
    }
    loadCustomerGeneralServices();
  }, [formData.customer_id]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('id') ? value : parseFloat(value) || 0
    }));
  };

  const calculateTotals = () => {
    const currentOtherExpenses = showOtherExpenses 
      ? selectedOtherExpenses.reduce((sum, name) => sum + (otherExpensesPrices[name] || 0), 0)
      : formData.other_expenses;
    const subtotal = formData.medical_escort_charges + formData.ticket_charges + formData.documentation_charges + currentOtherExpenses;
    const vatAmount = subtotal * (formData.tax_vat_percent / 100);
    const total_amount = subtotal + vatAmount - formData.discount;
    const actual_advance = fullAmountReceived ? total_amount : formData.advance_payment;
    const balance_amount = total_amount - actual_advance;
    
    let status = 'Unpaid';
    if (actual_advance > 0 && actual_advance < total_amount) status = 'Partially Paid';
    if (balance_amount <= 0 && total_amount > 0) status = 'Paid';
    if (fullAmountReceived) status = 'Paid';

    return { subtotal, vatAmount, total_amount, balance_amount, status, actual_advance };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('Select Customer');

    setLoading(true);
    
    const detailedExpensesPayload = selectedOtherExpenses.map(name => ({
      name,
      amount: otherExpensesPrices[name] || 0
    }));

    const payload: any = {
      ...formData,
      other_expenses: showOtherExpenses ? detailedExpensesPayload.reduce((sum, item) => sum + item.amount, 0) : formData.other_expenses,
      advance_payment: totals.actual_advance,
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
      balance_amount: totals.balance_amount,
      status: totals.status,
      mission_id: formData.mission_id || null,
      other_expenses_details: showOtherExpenses ? detailedExpensesPayload : []
    };

    if (!useCurrentDate && customDate) {
      payload.created_at = new Date(customDate).toISOString();
    } else if (useCurrentDate) {
      payload.created_at = new Date().toISOString();
    }

    const { error } = await supabaseAuth.from('invoices').update(payload).eq('id', id);
    
    if (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    } else {
      router.push('/invoices');
    }
  };

  const filteredMissions = formData.customer_id ? missions.filter(m => m.customer_id === formData.customer_id) : [];

  if (dataLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Link href="/invoices" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Invoices
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Invoice</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>

          <div className={styles.formSection}>Client Details</div>
          
          <div className={styles.formGroup}>
            <label>Select Customer *</label>
            <select name="customer_id" required value={formData.customer_id} onChange={handleChange}>
              <option value="">-- Choose Customer --</option>
              {customers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Link Escort Mission (Optional)</label>
            <select name="mission_id" value={formData.mission_id} onChange={handleChange}>
              <option value="">-- No Mission Linked --</option>
              {filteredMissions.map(m => <option key={m.id} value={m.id}>{m.from_country} → {m.to_country}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Invoice Issue Date</span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Check to forcefully update the invoice date to today, or uncheck to specify a custom date.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="use_current_date" checked={useCurrentDate} onChange={e => setUseCurrentDate(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }} />
                <label htmlFor="use_current_date" style={{ margin: 0, fontWeight: 500, color: '#475569', cursor: 'pointer' }}>Update to Today</label>
              </div>
              {!useCurrentDate && (
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', color: '#334155', fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} />
              )}
            </div>
          </div>

          <div className={styles.formSection}>Charges</div>
          
          <div className={styles.formGroup}>
            <label>Medical Escort Charges ($) *</label>
            <input type="number" step="0.01" name="medical_escort_charges" required value={formData.medical_escort_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Ticket Charges ($)</label>
            <input type="number" step="0.01" name="ticket_charges" value={formData.ticket_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Documentation Charges ($)</label>
            <input type="number" step="0.01" name="documentation_charges" value={formData.documentation_charges} onChange={handleChange} />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input type="checkbox" id="show_other" checked={showOtherExpenses} onChange={e => setShowOtherExpenses(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="show_other" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Add Other Expenses Details</label>
            </div>
            {showOtherExpenses && (
              <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px', color: '#334155' }}>Select Additional Services</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                  {fixedServices.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                        <input type="checkbox" checked={selectedOtherExpenses.includes(s)} onChange={e => {
                          if (e.target.checked) setSelectedOtherExpenses([...selectedOtherExpenses, s]);
                          else {
                            setSelectedOtherExpenses(selectedOtherExpenses.filter(x => x !== s));
                            const newPrices = {...otherExpensesPrices};
                            delete newPrices[s];
                            setOtherExpensesPrices(newPrices);
                          }
                        }} /> {s}
                      </label>
                      {selectedOtherExpenses.includes(s) && (
                        <input type="number" step="0.01" value={otherExpensesPrices[s] || ''} onChange={e => setOtherExpensesPrices({...otherExpensesPrices, [s]: parseFloat(e.target.value) || 0})} placeholder="Price ($)" style={{ width: '90px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      )}
                    </div>
                  ))}
                  {docServiceTypes.filter(d => customerServices.includes(d.id)).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, color: '#2563eb' }}>
                        <input type="checkbox" checked={selectedOtherExpenses.includes(s.name)} onChange={e => {
                          if (e.target.checked) setSelectedOtherExpenses([...selectedOtherExpenses, s.name]);
                          else {
                            setSelectedOtherExpenses(selectedOtherExpenses.filter(x => x !== s.name));
                            const newPrices = {...otherExpensesPrices};
                            delete newPrices[s.name];
                            setOtherExpensesPrices(newPrices);
                          }
                        }} /> {s.name} (General)
                      </label>
                      {selectedOtherExpenses.includes(s.name) && (
                        <input type="number" step="0.01" value={otherExpensesPrices[s.name] || ''} onChange={e => setOtherExpensesPrices({...otherExpensesPrices, [s.name]: parseFloat(e.target.value) || 0})} placeholder="Price ($)" style={{ width: '90px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.formGroup} style={{ maxWidth: '300px' }}>
                  <label>Calculated Other Expenses ($)</label>
                  <input type="number" step="0.01" value={selectedOtherExpenses.reduce((sum, name) => sum + (otherExpensesPrices[name] || 0), 0)} readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                </div>
              </div>
            )}
            {!showOtherExpenses && (
              <div className={styles.formGroup} style={{ maxWidth: '300px' }}>
                <label>Other Expenses ($)</label>
                <input type="number" step="0.01" name="other_expenses" value={formData.other_expenses} onChange={handleChange} />
              </div>
            )}
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
          <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input type="checkbox" id="full_amount_received" checked={fullAmountReceived} onChange={(e) => setFullAmountReceived(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            <label htmlFor="full_amount_received" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>Full Amount Received</label>
          </div>
          {!fullAmountReceived && (
            <div className={styles.formGroup}>
              <label>Advance Payment Received ($)</label>
              <input type="number" step="0.01" name="advance_payment" value={formData.advance_payment} onChange={handleChange} />
            </div>
          )}

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
              <span style={{ color: '#166534', fontWeight: 600 }}>${totals.actual_advance.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Balance Due:</span>
              <span style={{ color: totals.balance_amount > 0 ? '#ef4444' : '#0f172a' }}>
                ${totals.balance_amount.toFixed(2)}
              </span>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
