import { supabaseAuth } from '@/lib/supabase';

export async function getEmployeeReportData() {
  const [salRes, empRes] = await Promise.all([
    supabaseAuth
      .from('employee_salaries')
      .select('*')
      .order('month', { ascending: false }),
    supabaseAuth
      .from('employees')
      .select('id, name, iqama_number, department')
  ]);

  if (salRes.error || !salRes.data) {
    console.error(salRes.error);
    alert('Failed to fetch employee salary data.');
    return;
  }

  const empMapById = new Map();
  const empMapByIqama = new Map();
  if (empRes.data) {
    empRes.data.forEach((e: any) => {
      empMapById.set(e.id, e);
      empMapByIqama.set(e.iqama_number, e);
    });
  }

  const exportData = salRes.data.map((sal: any) => {
    const emp = (sal.employee_id && empMapById.get(sal.employee_id)) || empMapByIqama.get(sal.employee_iqama);

    return {
      'Month': sal.month,
      'Employee Name': emp?.name || 'Unknown',
      'Employee ID': emp?.id || sal.employee_id || 'N/A',
      'Iqama Number': sal.employee_iqama || emp?.iqama_number || 'N/A',
      'Department': emp?.department || 'N/A',
      'Basic Salary': Number(sal.basic_salary || 0),
      'Advance Payment': Number(sal.advance_payment || 0),
      'Deductions': Number(sal.deductions || 0),
      'Net Salary': Number(sal.net_salary || 0),
      'Payment Status': sal.status || 'Pending',
    };
  });

  return exportData;
}
