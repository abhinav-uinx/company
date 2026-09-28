const fs = require('fs');
let c = fs.readFileSync('src/app/vault/page.tsx', 'utf8');

const modalState = `
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
`;

c = c.replace(/const \[selectedIds, setSelectedIds\] = useState<string\[\]>\(\[\]\);/, 'const [selectedIds, setSelectedIds] = useState<string[]>([]);\n' + modalState);

const handleReplace = `
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteIds(selectedIds);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    const docsToDelete = documents.filter(d => deleteIds.includes(d.id));

    // 1. Delete DB Records
    const { error } = await supabaseAuth.from('medif_records').delete().in('id', deleteIds);
    if (error) {
      setError("Delete failed: " + error.message);
      setLoading(false);
      return;
    }
`;

c = c.replace(/const handleDelete = async \(\) => \{[\s\S]*?const \{ error \} = await supabaseAuth\.from\('medif_records'\)\.delete\(\)\.in\('id', selectedIds\);\n    if \(error\) \{\n      setError\("Delete failed: " \+ error\.message\);\n      setLoading\(false\);\n      return;\n    \}/, handleReplace.trim());

// We must also update references of selectedIds to deleteIds inside the rest of the old handleDelete function block
// But wait, it's easier to just do it precisely
c = c.replace(/setSelectedIds\(\[\]\);\n      fetchDocuments\(\);\n    \}\n  \};/, 'setSelectedIds([]);\n      fetchDocuments();\n    }\n  };\n');

const modalJSX = `
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Confirm Deletion</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to delete {deleteIds.length} document(s)?<br/><br/>
              <b>Warning:</b> This will permanently delete all associated files related to it! This action cannot be undone.
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

fs.writeFileSync('src/app/vault/page.tsx', c);
console.log('Vault done');
