const fs = require('fs');
let c = fs.readFileSync('src/app/admin/directory/attendance/page.tsx', 'utf8');

const modalState = `
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{id: string, time: string} | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
`;

c = c.replace(/const \[activeTab, setActiveTab\] = useState\('mark'\);/, 'const [activeTab, setActiveTab] = useState(\'mark\');\n' + modalState);

const handleReplace = `
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
      date: dateToday,
      check_in: timeNow
    }]);

    if (error) {
      setAlertMessage("Error marking attendance: " + error.message);
      setShowAlertModal(true);
    } else {
      fetchData();
      setIqamaInput('');
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
      setIqamaInput('');
    }
  };
`;

c = c.replace(/if \(existing\) \{[\s\S]*?setIqamaInput\(''\);\n    \}\n  \};/, handleReplace.trim());

const modalJSX = `
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
`;

c = c.replace(/<div className=\{styles\.container\}>/, '<div className={styles.container}>\n' + modalJSX);

fs.writeFileSync('src/app/admin/directory/attendance/page.tsx', c);
console.log('Attendance done');
