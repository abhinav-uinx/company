const fs = require('fs');

function restoreAndFix(file) {
    let c = fs.readFileSync(file, 'utf8');

    // Remove broken blocks
    c = c.replace(/\{!isGeneral && \(\s*<>\s*/g, '');
    c = c.replace(/\s*<\/>\s*\)\}/g, '');

    // Now insert them cleanly using exact known text
    c = c.replace('<div className={styles.formGroup}>\n              <label>Current Hospital</label>', 
        '{!isGeneral && (\n            <>\n            <div className={styles.formGroup}>\n              <label>Current Hospital</label>');

    // Close it right before the submit button / Passport Photos section
    if (file.includes('[id]')) {
        c = c.replace('<div className={styles.formSection}>Passport Photos / Documents</div>',
            '            </>\n          )}\n          <div className={styles.formSection}>Passport Photos / Documents</div>');
    } else {
        c = c.replace('{msg.text && <div',
            '            </>\n          )}\n\n            {msg.text && <div');
    }

    fs.writeFileSync(file, c);
}

restoreAndFix('src/app/customers/new/page.tsx');

// Also for [id], fix the fetchCustomer syntax error
let idContent = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
idContent = idContent.replace(
`    const sRes = await supabaseAuth.from('services').select('*');
    if (sRes.data) setServices(sRes.data);
  } = await supabaseAuth.from('customers').select('*').eq('id', id).single();`, 
`} = await supabaseAuth.from('customers').select('*').eq('id', id).single();
    const sRes = await supabaseAuth.from('services').select('*');
    if (sRes.data) setServices(sRes.data);`);
fs.writeFileSync('src/app/customers/[id]/page.tsx', idContent);

console.log('Fixed forms');
