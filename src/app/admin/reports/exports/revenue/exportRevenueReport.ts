import { supabaseAuth } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function getRevenueReportData() {
  const { data, error } = await supabaseAuth
    .from('invoices')
    .select('id, subtotal, tax_vat_percent, total_amount, advance_payment, balance_amount, status, created_at, customers(name)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error(error);
    alert('Failed to fetch invoice data.');
    return;
  }

  // Handle Supabase relationships type properly
  const exportData = data.map((inv: any) => ({
    'Invoice ID': inv.id,
    'Date': new Date(inv.created_at).toLocaleDateString(),
    'Customer Name': inv.customers?.name || 'Unknown',
    'Subtotal': inv.subtotal,
    'Tax %': inv.tax_vat_percent,
    'Total Amount': inv.total_amount,
    'Advance Paid': inv.advance_payment,
    'Balance Due': inv.balance_amount,
    'Status': inv.status,
  }));

  return exportData;
}
