const fs = require('fs');

function fixCustomers() {
    let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');
    
    if (!c.includes('const [showConfirmModal, setShowConfirmModal] = useState(false);')) {
        c = c.replace('const [deleteMode, setDeleteMode] = useState(false);', 
                      'const [deleteMode, setDeleteMode] = useState(false);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);\n  const [deleteIds, setDeleteIds] = useState<string[]>([]);');
    }
    
    const startStr = 'const handleDeleteSelected = async () => {';
    const endStr = '  };\n\n  const handleShare = async';
    
    if (c.includes(startStr) && c.includes(endStr)) {
        const startIdx = c.indexOf(startStr);
        const endIdx = c.indexOf(endStr);
        
        const replacement = `const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setDeleteIds(selectedIds);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    setDeleting(true);

    for (const id of deleteIds) {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        const serviceObj = services.find((s: any) => s.id === customer.service);
        const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
        if (bucket) {
           const { data: list } = await supabaseAuth.storage.from(bucket).list(id + '/passport');
           if (list && list.length > 0) {
             const toRemove = list.map(f => id + '/passport/' + f.name);
             await supabaseAuth.storage.from(bucket).remove(toRemove);
           }
        }
      }
    }

    const { error } = await supabaseAuth.from('customers').delete().in('id', deleteIds);
    setDeleting(false);
    
    if (error) {
      alert('Error deleting customers: ' + error.message);
    } else {
      setSelectedIds([]);
      setDeleteMode(false);
      fetchCustomers();
    }
  };\n\n  const handleShare = async`;
        
        c = c.substring(0, startIdx) + replacement + c.substring(endIdx + endStr.length);
    }
    
    fs.writeFileSync('src/app/customers/page.tsx', c);
}

function fixAttendance() {
    let c = fs.readFileSync('src/app/admin/directory/attendance/page.tsx', 'utf8');
    
    if (!c.includes('const [showConfirmModal, setShowConfirmModal] = useState(false);')) {
        c = c.replace('const [loading, setLoading] = useState(true);',
                      'const [loading, setLoading] = useState(true);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);\n  const [checkoutData, setCheckoutData] = useState<{id: string, time: string} | null>(null);\n  const [showAlertModal, setShowAlertModal] = useState(false);\n  const [alertMessage, setAlertMessage] = useState("");');
    }
    
    const startStr = 'if (existing) {';
    const endStr = "setIqamaInput('');\n    }\n  };";
    
    if (c.includes(startStr) && c.includes(endStr)) {
        const startIdx = c.indexOf(startStr);
        const endIdx = c.indexOf(endStr) + endStr.length;
        
        const replacement = `if (existing) {
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
  };`;
        
        c = c.substring(0, startIdx) + replacement + c.substring(endIdx);
    }

    fs.writeFileSync('src/app/admin/directory/attendance/page.tsx', c);
}

fixCustomers();
fixAttendance();
console.log("Fixed successfully");
