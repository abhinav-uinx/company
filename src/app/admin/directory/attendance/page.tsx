'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';
import { QuickCheckInModal, CheckOutConfirmModal, AttendanceAlertModal } from './components';

export default function AttendancePage(props: any) {
  const embedded = props?.embedded ?? false;
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{id?: string, employee_id?: string, iqama?: string, date?: string, time: string} | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [showQuickCheckInModal, setShowQuickCheckInModal] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [aRes, eRes, dRes] = await Promise.all([
      supabaseAuth.from('employee_attendance').select('*').order('date', { ascending: false }),
      supabaseAuth.from('employees').select('id, iqama_number, name, department_id').eq('status', 'active'),
      supabaseAuth.from('departments').select('id, name')
    ]);
    
    if (aRes.error) console.error("Attendance fetch error:", aRes.error);
    if (eRes.error) console.error("Employees fetch error:", eRes.error);
    if (dRes.error) console.error("Departments fetch error:", dRes.error);
    
    if (eRes.data) setEmployees(eRes.data);
    if (dRes.data) setDepartments(dRes.data);
    
    if (aRes.data && eRes.data) {
      // Map names locally by both employee_id (UUID) and employee_iqama
      const empMapByIqama = new Map();
      const empMapById = new Map();
      eRes.data.forEach(e => {
        empMapByIqama.set(e.iqama_number, e.name);
        empMapById.set(e.id, e.name);
      });
      const enrichedAttendance = aRes.data.map(a => ({
        ...a,
        employees: { name: (a.employee_id && empMapById.get(a.employee_id)) || empMapByIqama.get(a.employee_iqama) || 'Unknown' }
      }));
      setAttendance(enrichedAttendance);
    } else if (aRes.data) {
      setAttendance(aRes.data);
    }
    
    setLoading(false);
  }

  const handleQuickCheckInClick = () => {
    setSelectedDepartmentId("");
    setSelectedEmployees([]);
    setShowQuickCheckInModal(true);
  };

  const submitQuickCheckIn = async () => {
    if (selectedEmployees.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // Employee lookup map by iqama_number
    const empObjMap = new Map();
    employees.forEach(e => empObjMap.set(e.iqama_number, e));

    const { data: existing } = await supabaseAuth
      .from('employee_attendance')
      .select('*')
      .eq('date', today);
      
    const existingMap = new Map();
    if (existing) {
      existing.forEach((record: any) => {
        if (record.employee_id) existingMap.set(record.employee_id, record);
        if (record.employee_iqama) existingMap.set(record.employee_iqama, record);
      });
    }

    let errorOccurred = false;
    const toInsert = [];
    const checkouts = [];

    for (const iqama of selectedEmployees) {
      const emp = empObjMap.get(iqama);
      const empId = emp?.id || null;
      const rec = (empId && existingMap.get(empId)) || existingMap.get(iqama);

      if (rec) {
        if (!rec.check_out) {
          checkouts.push({
            id: rec.id,
            employee_id: empId || rec.employee_id,
            iqama: iqama,
            date: today,
            time: timeNow
          });
        }
      } else {
        toInsert.push({
          employee_iqama: iqama,
          employee_id: empId,
          date: today,
          check_in: timeNow,
          status: 'Present'
        });
      }
    }

    if (toInsert.length > 0) {
      let { error } = await supabaseAuth.from('employee_attendance').insert(toInsert);
      // Graceful fallback if employee_id column does not exist yet on remote db
      if (error && (error.message?.toLowerCase().includes('employee_id') || (error as any).code === 'PGRST204' || (error as any).code === '42703')) {
        const fallbackToInsert = toInsert.map(({ employee_id, ...rest }) => rest);
        const retry = await supabaseAuth.from('employee_attendance').insert(fallbackToInsert);
        error = retry.error;
      }
      if (error) {
        errorOccurred = true;
        setAlertMessage("Error marking attendance: " + error.message);
        setShowAlertModal(true);
      }
    }

    if (checkouts.length > 0) {
      for (const chk of checkouts) {
        let updateQuery = supabaseAuth
          .from('employee_attendance')
          .update({ check_out: chk.time });

        if (chk.id) {
          updateQuery = updateQuery.eq('id', chk.id);
        } else if (chk.employee_id) {
          updateQuery = updateQuery.eq('employee_id', chk.employee_id).eq('date', chk.date || today);
        } else {
          updateQuery = updateQuery.eq('employee_iqama', chk.iqama).eq('date', chk.date || today);
        }

        const { error: updateErr } = await updateQuery;
        if (updateErr) {
          errorOccurred = true;
          setAlertMessage("Error checking out: " + updateErr.message);
          setShowAlertModal(true);
        }
      }
    }

    if (!errorOccurred) {
      setShowQuickCheckInModal(false);
      fetchData();
    }
  };

  const confirmCheckout = async () => {
    setShowConfirmModal(false);
    if (!checkoutData) return;

    let updateQuery = supabaseAuth
      .from('employee_attendance')
      .update({ check_out: checkoutData.time });

    if (checkoutData.id) {
      updateQuery = updateQuery.eq('id', checkoutData.id);
    } else if (checkoutData.employee_id && checkoutData.date) {
      updateQuery = updateQuery.eq('employee_id', checkoutData.employee_id).eq('date', checkoutData.date);
    } else if (checkoutData.iqama && checkoutData.date) {
      updateQuery = updateQuery.eq('employee_iqama', checkoutData.iqama).eq('date', checkoutData.date);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) {
      setAlertMessage("Error checking out: " + updateErr.message);
      setShowAlertModal(true);
    } else {
      fetchData();
    }
  };

  return (
    <div className={embedded ? "" : styles.container}>

      <QuickCheckInModal
        isOpen={showQuickCheckInModal}
        departments={departments}
        employees={employees}
        selectedDepartmentId={selectedDepartmentId}
        selectedEmployees={selectedEmployees}
        onSelectDepartment={(deptId) => {
          setSelectedDepartmentId(deptId);
          setSelectedEmployees([]);
        }}
        onToggleEmployee={(iqama, checked) => {
          if (checked) {
            setSelectedEmployees(prev => [...prev, iqama]);
          } else {
            setSelectedEmployees(prev => prev.filter(id => id !== iqama));
          }
        }}
        onCancel={() => setShowQuickCheckInModal(false)}
        onSubmit={submitQuickCheckIn}
      />

      <CheckOutConfirmModal
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={confirmCheckout}
      />

      <AttendanceAlertModal
        isOpen={showAlertModal}
        message={alertMessage}
        onClose={() => setShowAlertModal(false)}
      />

      {!embedded && (
        <Link href="/admin/directory" className={styles.backBtn} style={{ marginBottom: '15px' }}>
          <span className="material-symbols-outlined">arrow_back</span> Back to Directory
        </Link>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Daily employee check-in and check-out attendance records.</p>
        <button onClick={handleQuickCheckInClick} style={{ background: '#4F5DFF', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>how_to_reg</span> Quick Check-in
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Date</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Employee / Iqama</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Check-In</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Check-Out</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0B1220', fontSize: '0.9rem' }}>Leave Type</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading Attendance Records...</td></tr>
          ) : attendance.length > 0 ? (
            attendance.map((a, idx) => (
              <tr key={a.id || `${a.employee_id || a.employee_iqama}-${a.date}-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px' }}><strong>{a.date}</strong></td>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{a.employees?.name || 'Unknown'}</strong><br/>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{a.employee_iqama}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{a.check_in || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {a.check_out ? (
                    a.check_out
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
                        setCheckoutData({
                          id: a.id,
                          employee_id: a.employee_id,
                          iqama: a.employee_iqama,
                          date: a.date,
                          time: timeNow
                        });
                        setShowConfirmModal(true);
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span> Check Out
                    </button>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    background: a.status === 'Present' ? '#dcfce7' : (a.status === 'Absent' ? '#fee2e2' : '#fef08a'), 
                    color: a.status === 'Present' ? '#166534' : (a.status === 'Absent' ? '#991b1b' : '#854d0e'),
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{a.leave_type || '—'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No attendance records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}






