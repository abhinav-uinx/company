'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../invoices.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function InvoiceDetail() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      const [invRes, payRes] = await Promise.all([
        supabaseAuth.from('invoices').select('*, patients(name, address), escort_missions(from_country, to_country)').eq('id', id).single(),
        supabaseAuth.from('payment_history').select('*').eq('invoice_id', id).order('payment_date', { ascending: false })
      ]);
      if (invRes.data) setInvoice(invRes.data);
      if (payRes.data) setPayments(payRes.data);
      setLoading(false);
    }
    loadInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className={styles.container}><LoadingIcon /></div>;
  if (!invoice) return <div className={styles.container}>Invoice not found.</div>;

  return (
    <div className={styles.container}>
      <Link href="/invoices" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Invoices
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice #{invoice.id.substring(0, 8).toUpperCase()}</h1>
        <button onClick={handlePrint} className={styles.addBtn}>
          <span className="material-symbols-outlined">print</span> Print / Download PDF
        </button>
      </div>

      <div className={styles.card} style={{ padding: '40px' }} id="printable-invoice">
        {/* Simple Printable Invoice Template */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a' }}>YOUR COMPANY NAME</h2>
            <p style={{ margin: '5px 0', color: '#64748b' }}>123 Corporate Ave, Business City</p>
            <p style={{ margin: 0, color: '#64748b' }}>support@company.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#2563eb' }}>INVOICE</h2>
            <p style={{ margin: '5px 0', color: '#64748b' }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p style={{ margin: 0, color: '#64748b' }}>Status: <strong style={{ color: invoice.status === 'Paid' ? '#166534' : '#991b1b' }}>{invoice.status}</strong></p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>Bill To:</h4>
            <p style={{ margin: '0 0 5px', fontWeight: 600 }}>{invoice.patients?.name}</p>
            <p style={{ margin: 0, color: '#64748b', whiteSpace: 'pre-line' }}>{invoice.patients?.address || 'No Address Provided'}</p>
          </div>
          {invoice.escort_missions && (
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>Mission Context:</h4>
              <p style={{ margin: 0, color: '#64748b' }}>{invoice.escort_missions.from_country} → {invoice.escort_missions.to_country}</p>
            </div>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#334155' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#334155' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.medical_escort_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Medical Escort Services</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>${invoice.medical_escort_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.ticket_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Flight & Ticket Charges</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>${invoice.ticket_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.documentation_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Documentation & Visa Processing</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>${invoice.documentation_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.other_expenses > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Other Miscellaneous Expenses</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>${invoice.other_expenses.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ width: '300px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#64748b' }}>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#64748b' }}>VAT / Tax ({invoice.tax_vat_percent}%):</span>
            <span>+ ${ (invoice.subtotal * (invoice.tax_vat_percent / 100)).toFixed(2) }</span>
          </div>
          {invoice.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>Discount:</span>
              <span>- ${invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #e2e8f0', fontWeight: 700, fontSize: '18px' }}>
            <span>Total Amount:</span>
            <span>${invoice.total_amount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#166534' }}>
            <span>Advance Paid:</span>
            <span>${invoice.advance_payment.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', fontWeight: 700, fontSize: '18px', color: invoice.balance_amount > 0 ? '#991b1b' : '#0f172a' }}>
            <span>Balance Due:</span>
            <span>${invoice.balance_amount.toFixed(2)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <h3 style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Payment History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '14px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '14px' }}>Method</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontSize: '14px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{p.payment_method || 'Standard'}</td>
                    <td style={{ padding: '8px', fontSize: '14px', textAlign: 'right', fontWeight: 500 }}>${p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}
