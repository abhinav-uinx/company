import { supabaseAuth } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function getCustomerReportData() {
  const { data, error } = await supabaseAuth
    .from('customers')
    .select('name, nationality, contact_number, email, passport_no, created_at, medical_condition')
    .order('nationality', { ascending: true });

  if (error || !data) {
    console.error(error);
    alert('Failed to fetch customer data.');
    return;
  }

  const exportData = data.map(c => ({
    'Name': c.name,
    'Nationality / Country': c.nationality || 'N/A',
    'Contact': c.contact_number,
    'Email': c.email,
    'Passport No': c.passport_no,
    'Medical Condition': c.medical_condition,
    'Registered Date': new Date(c.created_at).toLocaleDateString(),
  }));

  return exportData;
}
