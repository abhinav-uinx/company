'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [aRes, eRes] = await Promise.all([
      supabaseAuth.from('employee_attendance').select('*, employees(name)').order('date', { ascending: false }),
      supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active')
    ]);
    if (aRes.data) setAttendance(aRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  }

  const markAttendance = async () => {
    const iqama = prompt("Enter Employee Iqama Number for today's attendance:");
    if (!iqama) return;
    
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    const { data: existing } = await supabaseAuth
      .from('employee_attendance')
      .select('*')
      .eq('employee_iqama', iqama)
      .eq('date', today)
      .single();
      
    if (existing) {
      if (!existing.check_out) {
        if (confirm("Employee is already checked in today. Do you want to check them OUT now?")) {
          const { error: updateErr } = await supabaseAuth
            .from('employee_attendance')
            .update({ check_out: timeNow })
            .eq('id', existing.id);
          if (updateErr) alert("Error checking out: " + updateErr.message);
          else fetchData();
        }
      } else {
        alert("This employee has already completed their shift (checked in and out) for today.");
      }
      return;
    }

    const { error } = await supabaseAuth.from('employee_attendance').insert([{
      employee_iqama: iqama,
      date: today,
      check_in: timeNow,
      status: 'Present'
    }]);
    
    if (error) alert("Error marking attendance: " + error.message);
    else fetchData();
  };

  return (
    <div className={styles.container}>
      <Link href="/admin/directory" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Directory
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Attendance Management</h1>
        <button onClick={markAttendance} className={styles.addBtn}>
          <span className="material-symbols-outlined">how_to_reg</span> Quick Check-in
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee Name</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Status</th>
              <th>Leave Type</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Loading...</td></tr>
            ) : attendance.length > 0 ? (
              attendance.map(a => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.employees?.name || a.employee_iqama}</td>
                  <td>{a.check_in || '-'}</td>
                  <td>{a.check_out || '-'}</td>
                  <td style={{ color: a.status === 'Present' ? 'green' : 'red' }}>{a.status}</td>
                  <td>{a.leave_type || '-'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
