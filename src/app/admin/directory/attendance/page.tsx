'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAuth } from '@/lib/supabase';
import styles from '@/app/customers/customers.module.css';

export default function AttendancePage(props: any) {
  const embedded = props?.embedded ?? false;
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{id: string, time: string} | null>(null);
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
      supabaseAuth.from('employees').select('iqama_number, name, department_id').eq('status', 'active'),
      supabaseAuth.from('departments').select('id, name')
    ]);
    
    if (aRes.error) console.error("Attendance fetch error:", aRes.error);
    if (eRes.error) console.error("Employees fetch error:", eRes.error);
    if (dRes.error) console.error("Departments fetch error:", dRes.error);
    
    if (eRes.data) setEmployees(eRes.data);
    if (dRes.data) setDepartments(dRes.data);
    
    if (aRes.data && eRes.data) {
      // Map names locally
      const empMap = new Map();
      eRes.data.forEach(e => empMap.set(e.iqama_number, e.name));
      const enrichedAttendance = aRes.data.map(a => ({
        ...a,
        employees: { name: empMap.get(a.employee_iqama) || 'Unknown' }
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
    
    const { data: existing } = await supabaseAuth
      .from('employee_attendance')
      .select('*')
      .in('employee_iqama', selectedEmployees)
      .eq('date', today);
      
    const existingMap = new Map();
    if (existing) {
      existing.forEach((record: any) => existingMap.set(record.employee_iqama, record));
    }

    let errorOccurred = false;
    const toInsert = [];
    const checkouts = [];

    for (const iqama of selectedEmployees) {
      const rec = existingMap.get(iqama);
      if (rec) {
        if (!rec.check_out) {
          checkouts.push({ id: rec.id, time: timeNow, iqama: iqama });
        }
      } else {
        toInsert.push({
          employee_iqama: iqama,
          date: today,
          check_in: timeNow,
          status: 'Present'
        });
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabaseAuth.from('employee_attendance').insert(toInsert);
      if (error) {
        errorOccurred = true;
        setAlertMessage("Error marking attendance: " + error.message);
        setShowAlertModal(true);
      }
    }

    if (checkouts.length > 0) {
      for (const chk of checkouts) {
        const { error: updateErr } = await supabaseAuth
          .from('employee_attendance')
          .update({ check_out: chk.time })
          .eq('id', chk.id);
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
    <div className={embedded ? "" : styles.container}>

      {showQuickCheckInModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563eb', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>how_to_reg</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Quick Check-in</h3>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>Select Department</label>
              <select 
                value={selectedDepartmentId}
                onChange={(e) => { setSelectedDepartmentId(e.target.value); setSelectedEmployees([]); }}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              >
                <option value="">-- Select a Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {selectedDepartmentId && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>Select Employees</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
                  {employees.filter(e => e.department_id === selectedDepartmentId).length > 0 ? (
                    employees.filter(e => e.department_id === selectedDepartmentId).map(e => (
                      <label key={e.iqama_number} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedEmployees.includes(e.iqama_number)}
                          onChange={(ev) => {
                            if (ev.target.checked) {
                              setSelectedEmployees([...selectedEmployees, e.iqama_number]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== e.iqama_number));
                            }
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '0.95rem', color: '#334155' }}>{e.name} ({e.iqama_number})</span>
                      </label>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>No employees found in this department.</p>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowQuickCheckInModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={submitQuickCheckIn} disabled={selectedEmployees.length === 0} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: selectedEmployees.length === 0 ? 0.6 : 1 }}>
                Submit Check-in
              </button>
            </div>
          </div>
        </div>
      )}

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
            attendance.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px' }}><strong>{a.date}</strong></td>
                <td style={{ padding: '12px 16px' }}>
                  <strong>{a.employees?.name || 'Unknown'}</strong><br/>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{a.employee_iqama}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{a.check_in || '—'}</td>
                <td style={{ padding: '12px 16px' }}>{a.check_out || '—'}</td>
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






