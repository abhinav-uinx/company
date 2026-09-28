const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

const modalState = `
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
`;

c = c.replace(/const \[deleteMode, setDeleteMode\] = useState\(false\);/, 'const [deleteMode, setDeleteMode] = useState(false);\n' + modalState);

const handleReplace = `
  const handleDeleteSelected = async () => {
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
  };
`;

c = c.replace(/const handleDeleteSelected = async \(\) => \{[\s\S]*?fetchCustomers\(\);\n    \}\n  \};/, handleReplace.trim());

const modalJSX = `
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Confirm Deletion</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to delete {deleteIds.length} customer(s)?<br/><br/>
              <b>Warning:</b> Deleting customer details will permanently delete all the files (passports, tickets) related to it! This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
              </button>
            </div>
          </div>
        </div>
      )}
`;

c = c.replace(/<div className=\{styles\.container\}>/, '<div className={styles.container}>\n' + modalJSX);

fs.writeFileSync('src/app/customers/page.tsx', c);
console.log('Done');
