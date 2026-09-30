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
        supabaseAuth.from('invoices').select('*, customers!customer_id(name, address, passport_no), escort_missions(from_country, to_country)').eq('id', id).single(),
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

  const displayPayments = [...payments];
  const totalLoggedPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const unloggedPayment = (invoice.advance_payment || 0) - totalLoggedPayments;
  
  if (unloggedPayment > 0.01) {
    displayPayments.push({
      id: 'unlogged-advance',
      payment_date: invoice.created_at,
      payment_method: 'Advance / Direct Payment',
      amount: unloggedPayment
    });
  }

  return (
    <div className={styles.container}>
      <Link href="/invoices" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Invoices
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice #{invoice.id.substring(0, 8).toUpperCase()}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/invoices/${invoice.id}/edit`} className={styles.addBtn} style={{ background: '#f59e0b', color: 'white' }}>
            <span className="material-symbols-outlined">edit</span> Edit Invoice
          </Link>
          <button onClick={handlePrint} className={styles.addBtn}>
            <span className="material-symbols-outlined">print</span> Print / Download PDF
          </button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '60px', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxWidth: '900px', margin: '0 auto', color: '#334155', position: 'relative' }} id="printable-invoice">
        {/* Paid Stamp */}
        {invoice.status === 'Paid' && (
          <div style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            fontSize: '8rem',
            fontWeight: 900,
            color: 'rgba(22, 101, 52, 0.08)',
            border: '10px solid rgba(22, 101, 52, 0.08)',
            borderRadius: '20px',
            padding: '20px 50px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            PAID
          </div>
        )}

        {/* Professional Printable Invoice Template */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '30px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src="/Assets/Company logo/main_logo.png" alt="Logo" style={{ width: '100px', height: 'auto', objectFit: 'contain' }} />
            <div>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>MEDESCORT INTERNATIONAL</h2>
              <p style={{ margin: '5px 0', color: '#64748b', fontSize: '0.95rem' }}>123 Corporate Ave, Business City</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>support@medescortinternational.com</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#2563eb' }}>INVOICE</h2>
            <p style={{ margin: '5px 0', color: '#64748b' }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p style={{ margin: 0, color: '#64748b' }}>Status: <strong style={{ color: invoice.status === 'Paid' ? '#166534' : '#991b1b' }}>{invoice.status}</strong></p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h4 style={{ color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Bill To:</h4>
            <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{invoice.customers?.name}</p>
            <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{invoice.customers?.address || 'No Address Provided'}</p>
            {invoice.customers?.passport_no && (
              <p style={{ margin: '5px 0 0 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>book</span>
                Passport: <strong>{invoice.customers.passport_no}</strong>
              </p>
            )}
          </div>
          {invoice.escort_missions && (
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Mission Context:</h4>
              <p style={{ margin: 0, color: '#1e293b', fontWeight: 600, fontSize: '1.05rem' }}>{invoice.escort_missions.from_country} → {invoice.escort_missions.to_country}</p>
            </div>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1e293b' }}>
              <th style={{ padding: '16px 12px', textAlign: 'left', color: '#0f172a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Description</th>
              <th style={{ padding: '16px 12px', textAlign: 'right', color: '#0f172a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.medical_escort_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>Medical Escort Services</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>${invoice.medical_escort_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.ticket_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>Ticket Charges</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>${invoice.ticket_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.documentation_charges > 0 && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>Documentation Charges</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>${invoice.documentation_charges.toFixed(2)}</td>
              </tr>
            )}
            {invoice.other_expenses_details && invoice.other_expenses_details.length > 0 ? (
              invoice.other_expenses_details.map((item: any, idx: number) => {
                const name = typeof item === 'object' ? item.name : item;
                const amount = typeof item === 'object' ? item.amount : 0;
                return (
                  <tr key={`other-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>
                      {typeof item === 'object' ? `$${amount.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                );
              })
            ) : invoice.other_expenses > 0 ? (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>Other Miscellaneous Expenses</td>
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 500 }}>${invoice.other_expenses.toFixed(2)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div style={{ width: '280px', marginLeft: 'auto', paddingTop: '10px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#475569' }}>Subtotal:</span>
            <span style={{ fontWeight: 500 }}>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#475569' }}>VAT / Tax ({invoice.tax_vat_percent}%):</span>
            <span style={{ fontWeight: 500 }}>+ ${ (invoice.subtotal * (invoice.tax_vat_percent / 100)).toFixed(2) }</span>
          </div>
          {invoice.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#475569' }}>Discount:</span>
              <span style={{ fontWeight: 500, color: '#059669' }}>- ${invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '12px 0', borderTop: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
            <span>TOTAL AMOUNT:</span>
            <span>${invoice.total_amount.toFixed(2)}</span>
          </div>
          
          {invoice.status !== 'Paid' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#166534', fontWeight: 500 }}>
                <span>Advance Paid:</span>
                <span>${invoice.advance_payment.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #94a3b8', fontWeight: 800, fontSize: '1.05rem', color: invoice.balance_amount > 0 ? '#b91c1c' : '#0f172a' }}>
                <span>BALANCE DUE:</span>
                <span>${invoice.balance_amount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>


      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            transform-origin: top left;
          }
          /* Compact spacing to ensure it fits on one page */
          #printable-invoice > div:nth-child(1) { margin-bottom: 20px !important; padding-bottom: 15px !important; }
          #printable-invoice > div:nth-child(2) { margin-bottom: 20px !important; padding: 15px !important; }
          #printable-invoice > table { margin-bottom: 20px !important; }
          #printable-invoice td, #printable-invoice th { padding: 10px 8px !important; }
          #printable-invoice > div:nth-child(4) { padding: 15px !important; margin-bottom: 0 !important; }
          #printable-invoice .payment-history { margin-top: 20px !important; }
          
          /* Prevent page breaks inside important blocks */
          #printable-invoice { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}} />
    </div>
  );
}






