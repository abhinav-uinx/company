const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const regexUpdate = /if \(error\) \{[\s\S]*?setSaving\(false\);\n  \}/;

const replacementUpdate = `if (error) {
        setMsg({ text: 'Error updating: ' + error.message, type: 'error' });
      } else {
        setMsg({ text: 'Customer updated successfully! Redirecting...', type: 'success' });
        setTimeout(() => router.push('/customers'), 1500);
      }
      setSaving(false);
  }`;

c = c.replace(regexUpdate, replacementUpdate);

const regexButtons = /<button type="submit" className=\{styles\.submitBtn\} disabled=\{saving\} style=\{\{ width: '100%' \}\}>\n\s*\{saving \? 'Updating\.\.\.' : 'Save Changes'\}\n\s*<\/button>/;

const replacementButtons = `<div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => router.push('/customers')} disabled={saving} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>`;

c = c.replace(regexButtons, replacementButtons);

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed Edit page buttons and redirect');
