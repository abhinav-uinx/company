const fs = require('fs');
let c = fs.readFileSync('src/app/admin/sessions/page.tsx', 'utf8');

const modalState = `
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [terminateId, setTerminateId] = useState<string | null>(null);
`;

c = c.replace(/const \[loading, setLoading\] = useState\(true\);/, 'const [loading, setLoading] = useState(true);\n' + modalState);

const handleReplace = `
    const handleTerminate = async (id: string) => {
        setTerminateId(id);
        setShowConfirmModal(true);
    };

    const confirmTerminate = async () => {
        if (!terminateId) return;
        setShowConfirmModal(false);
        await terminateSession(terminateId);
        setSessions(s => s.filter(x => x.id !== terminateId));
        if (terminateId === currentSessionId) {
            router.replace('/login');
        }
        setTerminateId(null);
    };
`;

c = c.replace(/const handleTerminate = async \(id: string\) => \{[\s\S]*?router\.replace\('\/login'\);\n        \}\n    \};/, handleReplace.trim());

const modalJSX = `
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '15px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Terminate Session</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Are you sure you want to terminate this session?<br/><br/>
              <b>Warning:</b> If this user is currently active, they will be instantly logged out and redirected to the login page.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmTerminate} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Terminate
              </button>
            </div>
          </div>
        </div>
      )}
`;

c = c.replace(/<div style=\{\{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' \}\}>/, '<div style={{ padding: \'40px\', maxWidth: \'1000px\', margin: \'0 auto\', fontFamily: \'Inter, sans-serif\' }}>\n' + modalJSX);

fs.writeFileSync('src/app/admin/sessions/page.tsx', c);
console.log('Sessions done');
