'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from './invoices.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentAmt, setPaymentAmt] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const { data, error } = await supabaseAuth
      .from('invoices')
      .select('*, patients(name)')
      .order('created_at', { ascending: false });
    
    if (data) setInvoices(data);
    setLoading(false);
  }

  const getStatusClass = (status: string) => {
    if (status === 'Partially Paid') return styles.statusPartially;
    if (status === 'Paid') return styles.statusPaid;
    return styles.statusUnpaid;
  };

  return (
    <>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backBtn}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
        </Link>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Invoice & Billing</h1>
          <Link href="/invoices/new" className={styles.addBtn}>
            <span className="material-symbols-outlined">receipt_long</span> Create New Invoice
          </Link>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient Name</th>
                <th>Total Amount</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', position: 'relative', height: '200px' }}>
                    <LoadingIcon />
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.id.substring(0, 8)}...</td>
                    <td style={{ fontWeight: 500 }}>{inv.patients?.name || 'Unknown Patient'}</td>
                    <td>${inv.total_amount}</td>
                    <td>${inv.advance_payment}</td>
                    <td style={{ color: inv.balance_amount > 0 ? '#ef4444' : '#166534', fontWeight: 600 }}>
                      ${inv.balance_amount}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { setPaymentModal(inv); setPaymentAmt(inv.balance_amount); }} style={{ color: '#16a34a', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} disabled={inv.status === 'Paid'}>
                          {inv.status === 'Paid' ? 'Fully Paid' : 'Log Payment'}
                        </button>
                        <Link href={`/invoices/${inv.id}`} className={styles.actionLink} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          View PDF
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 15px' }}>Record Payment</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b' }}>Current Balance: <strong>${paymentModal.balance_amount}</strong></p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>Payment Amount ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={paymentAmt} 
                onChange={(e) => setPaymentAmt(parseFloat(e.target.value) || 0)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px' }}>
              <button onClick={() => setPaymentModal(null)} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#334155', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (paymentAmt <= 0) return alert('Amount must be greater than 0');
                const newAdvance = paymentModal.advance_payment + paymentAmt;
                const newBalance = paymentModal.total_amount - newAdvance;
                let newStatus = 'Partially Paid';
                if (newBalance <= 0) newStatus = 'Paid';
                
                // Update Invoice
                await supabaseAuth.from('invoices').update({
                  advance_payment: newAdvance,
                  balance_amount: newBalance < 0 ? 0 : newBalance,
                  status: newStatus
                }).eq('id', paymentModal.id);

                // Add to payment history
                await supabaseAuth.from('payment_history').insert([{
                  invoice_id: paymentModal.id,
                  amount: paymentAmt,
                  payment_method: 'Manual Payment'
                }]);

                setPaymentModal(null);
                fetchInvoices();
              }} style={{ padding: '10px 15px', background: '#16a34a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
