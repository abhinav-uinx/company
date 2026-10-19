import { supabaseAuth } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function getEmployeeReportData() {
  const { data, error } = await supabaseAuth
    .from('employee_salaries')
    .select('month, basic_salary, advance_payment, deductions, net_salary, status, employee_iqama')
    .order('month', { ascending: false });

  if (error || !data) {
    console.error(error);
    alert('Failed to fetch employee salary data.');
    return;
  }

  const exportData = data.map((sal: any) => ({
    'Month': sal.month,
    'Iqama Number': sal.employee_iqama,
    'Basic Salary': sal.basic_salary,
    'Advance Payment': sal.advance_payment,
    'Deductions': sal.deductions,
    'Net Salary': sal.net_salary,
    'Payment Status': sal.status,
  }));

  return exportData;
}
