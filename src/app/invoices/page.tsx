'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import { supabaseAuth } from '@/lib/supabase';
import styles from './invoices.module.css';
import TableSkeleton from '@/components/TableSkeleton';
import LoadingIcon from '@/components/LoadingIcon';
import { RecordPaymentModal } from './components';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const { role, isFolderAllowed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentAmt, setPaymentAmt] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [role, isFolderAllowed]);

  async function fetchInvoices() {
    setLoading(true);
    const { data, error } = await supabaseAuth
      .from('invoices')
      .select('*, customers!customer_id(name)')
      .order('created_at', { ascending: false });
    
    if (data) setInvoices(data);
    setLoading(false);
  }

  const getStatusClass = (status: string) => {
    if (status === 'Partially Paid') return styles.statusPartially;
    if (status === 'Paid') return styles.statusPaid;
    return styles.statusUnpaid;
  };

  if (role === 'employee' && !isFolderAllowed('invoices')) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>block</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Access Prohibited</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
          Your account does not have permission to access the <strong>Invoice & Billing</strong> folder. Please contact an administrator.
        </p>
        <Link href="/user/dashboard" style={{ background: '#4F5DFF', color: '#fff', textDecoration: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Dashboard
        </Link>
      </div>
    );
  }

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
          <div className={styles.tableWrapper}><table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={7} />
              ) : invoices.length > 0 ? (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.id.substring(0, 8)}...</td>
                    <td style={{ fontWeight: 500 }}>{inv.customers?.name || 'Unknown Customer'}</td>
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
                        <Link href={`/invoices/${inv.id}/edit`} className={styles.actionLink} style={{ color: '#f59e0b', textDecoration: 'none' }}>
                          Edit
                        </Link>
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
          </table></div>
        </div>
      </div>

      <RecordPaymentModal
        paymentModal={paymentModal}
        onClose={() => setPaymentModal(null)}
        onConfirm={async (amount: number) => {
          const newAdvance = (paymentModal.advance_payment || 0) + amount;
          const newBalance = (paymentModal.total_amount || 0) - newAdvance;
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
            amount: amount,
            payment_method: 'Manual Payment'
          }]);

          setPaymentModal(null);
          fetchInvoices();
        }}
      />
    </>
  );
}







