import os

def fix_customers():
    with open('src/app/customers/page.tsx', 'r', encoding='utf-8') as f:
        c = f.read()
    
    # 1. State
    if 'const [showConfirmModal, setShowConfirmModal] = useState(false);' not in c:
        c = c.replace('const [deleteMode, setDeleteMode] = useState(false);', 
                      'const [deleteMode, setDeleteMode] = useState(false);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);\n  const [deleteIds, setDeleteIds] = useState<string[]>([]);')
    
    # 2. handleDeleteSelected
    start_str = 'const handleDeleteSelected = async () => {'
    end_str = '  };\n\n  const handleShare = async'
    if start_str in c and end_str in c:
        start_idx = c.find(start_str)
        end_idx = c.find(end_str)
        
        replacement = """const handleDeleteSelected = async () => {
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
  };\n\n"""
        
        c = c[:start_idx] + replacement + c[end_idx + len('  };\n\n'):]
    
    with open('src/app/customers/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)

def fix_attendance():
    with open('src/app/admin/directory/attendance/page.tsx', 'r', encoding='utf-8') as f:
        c = f.read()
    
    if 'const [showConfirmModal, setShowConfirmModal] = useState(false);' not in c:
        c = c.replace('const [loading, setLoading] = useState(true);',
                      'const [loading, setLoading] = useState(true);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);\n  const [checkoutData, setCheckoutData] = useState<{id: string, time: string} | null>(null);\n  const [showAlertModal, setShowAlertModal] = useState(false);\n  const [alertMessage, setAlertMessage] = useState("");')
    
    start_str = 'if (existing) {'
    end_str = 'setIqamaInput(\'\');\n    }\n  };'
    if start_str in c and end_str in c:
        start_idx = c.find(start_str)
        end_idx = c.find(end_str) + len(end_str)
        
        replacement = """if (existing) {
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
  };"""
        
        c = c[:start_idx] + replacement + c[end_idx:]

    with open('src/app/admin/directory/attendance/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c)

fix_customers()
fix_attendance()
print("Fixed successfully")
