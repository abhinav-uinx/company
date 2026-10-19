'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { calculateComprehensiveTax, Region, formatCurrency } from './taxUtils';
import { supabaseAuth } from '@/lib/supabase';
import styles from './excel.module.css';

interface ReportRow {
  id: string;
  date: string;
  description: string;
  receivedAmount: number;
  expenseAmount: number;
}

export default function ReportsDashboard() {
  const [region, setRegion] = useState<Region>('India');
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      const { data: invoices, error } = await supabaseAuth
        .from('invoices')
        .select('id, created_at, subtotal, ticket_charges, other_expenses, customers(name)');

      if (error) {
        console.error("Error fetching ledger data:", error);
        setLoading(false);
        return;
      }

      const formattedData: ReportRow[] = invoices?.map((inv: any) => ({
        id: inv.id.split('-')[0], // Shorten ID for display
        date: new Date(inv.created_at).toISOString().split('T')[0],
        description: `Invoice - ${inv.customers?.name || 'Unknown'}`,
        receivedAmount: Number(inv.subtotal) || 0,
        expenseAmount: (Number(inv.ticket_charges) || 0) + (Number(inv.other_expenses) || 0),
      })) || [];

      setData(formattedData);
      setLoading(false);
    }
    
    fetchLedger();
  }, []);

  const processedData = useMemo(() => {
    return data.map((row) => {
      const taxDetails = calculateComprehensiveTax(row.receivedAmount, row.expenseAmount, region);
      return {
        ...row,
        indirectTaxAmount: taxDetails.indirectTaxAmount,
        totalInvoiceAmount: taxDetails.totalInvoiceAmount,
        netProfit: taxDetails.netProfit,
        corporateTaxAmount: taxDetails.corporateTaxAmount,
        netIncomeAfterTax: taxDetails.netIncomeAfterTax,
        totalGovernmentTax: taxDetails.totalGovernmentTax,
        currency: taxDetails.currency,
        indirectTaxRateStr: `${taxDetails.indirectTaxRate}%`,
        corporateTaxRateStr: `${taxDetails.corporateTaxRate}%`,
      };
    });
  }, [data, region]);

  const handleExportExcel = () => {
    const exportData = processedData.map(row => ({
      'Transaction ID': row.id,
      'Date': row.date,
      'Description': row.description,
      'Revenue': row.receivedAmount,
      'Expenses': row.expenseAmount,
      'Gross Profit': row.netProfit,
      [`Corporate Tax (${row.corporateTaxRateStr})`]: row.corporateTaxAmount,
      'Net Take-Home (After Tax)': row.netIncomeAfterTax,
      [`VAT/GST (${row.indirectTaxRateStr})`]: row.indirectTaxAmount,
      'Total Gov Tax Liability': row.totalGovernmentTax,
      'Final Customer Invoice': row.totalInvoiceAmount,
      'Currency': row.currency,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    
    XLSX.writeFile(workbook, `Financial_Report_${region}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>
            <span className={`material-symbols-outlined ${styles.headerIcon}`}>account_balance</span>
            Corporate Tax & Profit Ledger
          </h2>
          <p className={styles.headerDescription}>Calculate net profit, VAT/GST, and your total corporate tax obligation to the government.</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.regionSelectWrapper}>
            <label htmlFor="region-select" className={styles.regionLabel}>Tax Region:</label>
            <select
              id="region-select"
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className={styles.regionSelect}
            >
              <option value="India">🇮🇳 India (18% GST / 25% Corp)</option>
              <option value="KSA">🇸🇦 KSA (15% VAT / 20% Corp)</option>
            </select>
          </div>
          
          <button onClick={handleExportExcel} className={styles.exportBtn}>
            <span className="material-symbols-outlined" style={{marginRight: '8px', fontSize: '20px'}}>download</span>
            Export XLSX
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Trx ID</th>
              <th>Description</th>
              <th className={styles.rightAlign}>Revenue</th>
              <th className={styles.rightAlign}>Expenses</th>
              <th className={`${styles.rightAlign} ${styles.taxHighlight}`}>Profit</th>
              <th className={`${styles.rightAlign} ${styles.totalHighlight}`}>Corporate Tax ({region === 'India' ? '25%' : '20%'})</th>
              <th className={`${styles.rightAlign} ${styles.totalHighlight}`} style={{ color: '#16a34a' }}>Net Take-Home</th>
              <th className={`${styles.rightAlign} ${styles.taxHighlight}`}>VAT/GST ({region === 'India' ? '18%' : '15%'})</th>
              <th className={`${styles.rightAlign} ${styles.totalHighlight}`} style={{ color: '#b91c1c' }}>Total to Gov</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>Loading real ledger data...</td></tr>
            ) : processedData.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No transactions found.</td></tr>
            ) : (
              processedData.map((row) => (
                <tr key={row.id} className={styles.tableRow}>
                  <td className={styles.idCell} title={row.id}>{row.id.substring(0, 8)}...</td>
                  <td className={styles.descCell}>{row.description}</td>
                  <td className={`${styles.rightAlign} ${styles.amountCell}`}>
                    {formatCurrency(row.receivedAmount, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.amountCell}`} style={{ color: '#ef4444' }}>
                    - {formatCurrency(row.expenseAmount, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.taxCell}`} style={{ background: 'transparent' }}>
                    {formatCurrency(row.netProfit, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.totalCell}`}>
                    {formatCurrency(row.corporateTaxAmount, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.totalCell}`} style={{ color: '#16a34a' }}>
                    {formatCurrency(row.netIncomeAfterTax, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.taxCell}`}>
                    {formatCurrency(row.indirectTaxAmount, row.currency)}
                  </td>
                  <td className={`${styles.rightAlign} ${styles.totalCell}`} style={{ color: '#b91c1c' }}>
                    {formatCurrency(row.totalGovernmentTax, row.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className={styles.tfootRow}>
              <td colSpan={2} className={styles.tfootLabel}>Grand Totals</td>
              <td className={styles.tfootAmount}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.receivedAmount, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootAmount} style={{ color: '#fca5a5' }}>
                - {formatCurrency(processedData.reduce((sum, row) => sum + row.expenseAmount, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootTax} style={{ background: 'transparent', color: '#a5b4fc' }}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.netProfit, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootTotal}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.corporateTaxAmount, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootTotal} style={{ color: '#4ade80' }}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.netIncomeAfterTax, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootTax}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.indirectTaxAmount, 0), processedData[0]?.currency || '')}
              </td>
              <td className={styles.tfootTotal} style={{ color: '#fca5a5' }}>
                {formatCurrency(processedData.reduce((sum, row) => sum + row.totalGovernmentTax, 0), processedData[0]?.currency || '')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
