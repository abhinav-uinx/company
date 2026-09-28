const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const regexUpdate = /if \(error\) \{\s*setMsg\(\{ text: 'Error updating: ' \+ error\.message, type: 'error' \}\);\s*\} else \{\s*setMsg\(\{ text: 'Customer updated successfully!', type: 'success' \}\);\s*setTimeout\(\(\) => setMsg\(\{ text: '', type: '' \}\), 3000\);\s*\}\s*setSaving\(false\);\s*\}/;

const replacementUpdate = `if (error) {
      setMsg({ text: 'Error updating: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Customer updated successfully! Redirecting...', type: 'success' });
      setTimeout(() => router.push('/customers'), 1500);
    }
    setSaving(false);
  }`;

c = c.replace(regexUpdate, replacementUpdate);

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed redirect logic');
