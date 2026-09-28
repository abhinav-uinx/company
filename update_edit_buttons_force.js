const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const oldUpdateStr = "if (error) {\n      setMsg({ text: 'Error updating: ' + error.message, type: 'error' });\n    } else {\n      setMsg({ text: 'Customer updated successfully!', type: 'success' });\n      setTimeout(() => setMsg({ text: '', type: '' }), 3000);\n    }\n    setSaving(false);\n  };";
const oldUpdateIdx = c.indexOf("if (error) {\n      setMsg({ text: 'Error updating: ' + error.message, type: 'error' });");
const oldUpdateEndIdx = c.indexOf("setSaving(false);\n  };", oldUpdateIdx) + "setSaving(false);\n  };".length;

if (oldUpdateIdx !== -1) {
    const newUpdateStr = `if (error) {
      setMsg({ text: 'Error updating: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Customer updated successfully! Redirecting...', type: 'success' });
      setTimeout(() => router.push('/customers'), 1500);
    }
    setSaving(false);
  };`;
    c = c.substring(0, oldUpdateIdx) + newUpdateStr + c.substring(oldUpdateEndIdx);
}

const btnStr = "<button type=\"submit\" className={styles.submitBtn} disabled={saving} style={{ width: '100%' }}>";
const btnIdx = c.indexOf(btnStr);
const btnEndIdx = c.indexOf("</button>", btnIdx) + "</button>".length;

if (btnIdx !== -1) {
    const newBtnStr = `<div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => router.push('/customers')} disabled={saving} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>`;
    c = c.substring(0, btnIdx) + newBtnStr + c.substring(btnEndIdx);
}

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed Edit page buttons and redirect accurately!');
