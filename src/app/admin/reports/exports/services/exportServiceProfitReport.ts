import { supabaseAuth } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function getServiceProfitReportData() {
  const { data: invoices, error } = await supabaseAuth
    .from('invoices')
    .select('total_amount, customer_id');

  const { data: customers } = await supabaseAuth
    .from('customers')
    .select('id, service');
    
  const { data: services } = await supabaseAuth
    .from('services')
    .select('id, name');

  if (error || !invoices) {
    console.error(error);
    alert('Failed to fetch service data.');
    return;
  }

  const serviceTotals: Record<string, number> = {};

  invoices.forEach((inv: any) => {
    const customer = customers?.find(c => c.id === inv.customer_id);
    const service = services?.find(s => s.id === customer?.service);
    
    const serviceName = service?.name || 'Uncategorized Service';
    if (!serviceTotals[serviceName]) {
      serviceTotals[serviceName] = 0;
    }
    serviceTotals[serviceName] += (Number(inv.total_amount) || 0);
  });

  const exportData = Object.keys(serviceTotals).map(serviceName => ({
    'Service Category': serviceName,
    'Total Gross Revenue Generated': serviceTotals[serviceName],
  }));

  return exportData;
}
