'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{id: string, time: string} | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

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
        setCheckoutData({ id: existing.id, time: timeNow });
        setShowConfirmModal(true);
      } else {
        setAlertMessage("This employee has already completed their shift (checked in and out) for today.");
        setShowAlertModal(true);
      }
      return;
    }

    const { error } = await supabaseAuth.from('employee_attendance').insert([{
      employee_iqama: iqama,
      date: today,
      check_in: timeNow,
      status: 'Present'
    }]);
    
    if (error) {
      setAlertMessage("Error marking attendance: " + error.message);
      setShowAlertModal(true);
    } else {
      fetchData();
    }
  };

  const confirmCheckout = async () => {
    setShowConfirmModal(false);
    if (!checkoutData) return;
    const { error: updateErr } = await supabaseAuth
      .from('employee_attendance')
      .update({ check_out: checkoutData.time })
      .eq('id', checkoutData.id);
    if (updateErr) {
      setAlertMessage("Error checking out: " + updateErr.message);
      setShowAlertModal(true);
    } else {
      fetchData();
      
    }
  };

  return (
    <div className={styles.container}>

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>info</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Check Out?</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Employee is already checked in today. Do you want to check them <b>OUT</b> now?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmCheckout} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>error</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Notice</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlertModal(false)} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

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






