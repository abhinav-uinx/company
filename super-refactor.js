const fs = require('fs');
const path = require('path');

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// 1. Rename 'patient' to 'customer' in the directory files
function renameWords(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/patients/g, 'customers');
  c = c.replace(/patient_id/g, 'customer_id');
  c = c.replace(/patient/g, 'customer');
  c = c.replace(/Patients/g, 'Customers');
  c = c.replace(/Patient/g, 'Customer');
  c = c.replace(/setPatients/g, 'setCustomers');
  c = c.replace(/setPatient/g, 'setCustomer');
  c = c.replace(/fetchPatients/g, 'fetchCustomers');
  c = c.replace(/filteredPatients/g, 'filteredCustomers');
  c = c.replace(/viewPatient/g, 'viewCustomer');
  c = c.replace(/setViewPatient/g, 'setViewCustomer');
  c = c.replace(/totalPatients/g, 'totalCustomers');
  c = replaceAll(c, 'patients.module.css', 'customers.module.css');
  fs.writeFileSync(file, c);
}
renameWords('src/app/customers/page.tsx');
renameWords('src/app/customers/new/page.tsx');
renameWords('src/app/customers/[id]/page.tsx');

// 2. Modify page.tsx (Customer List)
let listPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');
listPage = listPage.replace(/\.select\('\*'\)/, ".select('*, services(name)')");
listPage = listPage.replace(/<th>Nationality<\/th>/, "<th>Service</th>\n              <th>Nationality</th>");
listPage = listPage.replace(/<td>\{customer\.nationality \|\| 'N\/A'\}<\/td>/, "<td>{customer.services?.name || 'Unassigned'}</td>\n                  <td>{customer.nationality || 'N/A'}</td>");
listPage = listPage.replace(/colSpan=\{5\}/g, "colSpan={6}");
listPage = replaceAll(listPage, '<td colSpan="5"', '<td colSpan="6"');
const iqamaHtml = `                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Iqama Number</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.iqama_number || 'N/A'}</div>
                  </div>`;
listPage = listPage.replace(/<div style=\{\{ fontSize: '0\.75rem', color: '#64748b', marginBottom: '4px' \}\}>Date of Birth<\/div>/, iqamaHtml + '\n                  <div style={{ background: \'#f8fafc\', padding: \'12px\', borderRadius: \'12px\', border: \'1px solid #f1f5f9\' }}>\n                    <div style={{ fontSize: \'0.75rem\', color: \'#64748b\', marginBottom: \'4px\' }}>Date of Birth</div>');
fs.writeFileSync('src/app/customers/page.tsx', listPage);

// 3. Modify new/page.tsx
let newPage = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
newPage = newPage.replace(/import \{ useState \} from 'react';/, "import { useState, useEffect } from 'react';");
newPage = newPage.replace(/const \[msg, setMsg\] = useState\(\{ text: '', type: '' \}\);/, "const [msg, setMsg] = useState({ text: '', type: '' });\n  const [services, setServices] = useState<any[]>([]);\n\n  useEffect(() => {\n    async function fetchServices() {\n      const { data } = await supabaseAuth.from('services').select('*');\n      if (data) setServices(data);\n    }\n    fetchServices();\n  }, []);");
newPage = newPage.replace(/name: '',/, "service_id: '',\n    iqama_number: '',\n    name: '',");

// Inject dynamic logic check
newPage = newPage.replace(/(return \(\n\s*<div className=\{styles\.container\}>)/, "const selectedService = services.find(s => s.id === formData.service_id);\n  const isGeneral = selectedService && selectedService.name === 'General Service';\n\n  $1");

// Basic Info -> Iqama
newPage = newPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Full Name \*<\/label>/, 
  "<div className={styles.formGroup}>\n              <label>Iqama Number</label>\n              <input type=\"text\" name=\"iqama_number\" value={formData.iqama_number || ''} onChange={handleChange} />\n            </div>\n            <div className={styles.formGroup}>\n              <label>Full Name *</label>");

// Passport & Visa -> Service Type + Passport & Visa
newPage = newPage.replace(/<div className=\{styles\.formSection\}>Passport & Visa Details<\/div>/,
`<div className={styles.formSection}>Service Type</div>
          <div className={styles.formGroup}>
            <label>Select Service *</label>
            <select name="service_id" required value={formData.service_id || ''} onChange={handleChange}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={styles.formSection}>Passport & Visa Details</div>`);

// Medical & Emergency conditional logic
newPage = newPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Current Hospital<\/label>/,
`{!isGeneral && (
              <>
            <div className={styles.formGroup}>
              <label>Current Hospital</label>`);

newPage = newPage.replace(/onChange=\{handleChange\}><\/textarea>\s*<\/div>\s*\{msg\.text && <div/,
`onChange={handleChange}></textarea>
            </div>
            </>
          )}

            {msg.text && <div`);
fs.writeFileSync('src/app/customers/new/page.tsx', newPage);

// 4. Modify [id]/page.tsx
let idPage = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
idPage = idPage.replace(/import \{ useState \} from 'react';/, "import { useState, useEffect } from 'react';");
idPage = idPage.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(true);\n  const [services, setServices] = useState<any[]>([]);");

// Fix fetchCustomer carefully!
idPage = idPage.replace(/const \{ data, error \} = await supabaseAuth\.from\('customers'\)\.select\('\*'\)\.eq\('id', id\)\.single\(\);/,
`const { data, error } = await supabaseAuth.from('customers').select('*').eq('id', id).single();
      const sRes = await supabaseAuth.from('services').select('*');
      if (sRes.data) setServices(sRes.data);`);

// Basic Info -> Iqama
idPage = idPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Full Name \*<\/label>/, 
  "<div className={styles.formGroup}>\n              <label>Iqama Number</label>\n              <input type=\"text\" name=\"iqama_number\" value={formData.iqama_number || ''} onChange={handleChange} />\n            </div>\n            <div className={styles.formGroup}>\n              <label>Full Name *</label>");

// Passport & Visa -> Service Type + Passport & Visa
idPage = idPage.replace(/<div className=\{styles\.formSection\}>Passport & Visa Details<\/div>/,
`<div className={styles.formSection}>Service Type</div>
          <div className={styles.formGroup}>
            <label>Select Service *</label>
            <select name="service_id" required value={formData.service_id || ''} onChange={handleChange}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={styles.formSection}>Passport & Visa Details</div>`);

// Inject dynamic logic check
idPage = idPage.replace(/(return \(\n\s*<div className=\{styles\.container\}>)/, "const selectedService = services.find(s => s.id === formData.service_id);\n  const isGeneral = selectedService && selectedService.name === 'General Service';\n\n  $1");

// Medical & Emergency conditional logic
idPage = idPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Current Hospital<\/label>/,
`{!isGeneral && (
              <>
            <div className={styles.formGroup}>
              <label>Current Hospital</label>`);

idPage = idPage.replace(/onChange=\{handleChange\}><\/textarea>\s*<\/div>\s*<div className=\{styles\.formSection\}>Passport Photos \/ Documents<\/div>/,
`onChange={handleChange}></textarea>
            </div>
            </>
          )}

          <div className={styles.formSection}>Passport Photos / Documents</div>`);
fs.writeFileSync('src/app/customers/[id]/page.tsx', idPage);

console.log('Fully refactored safely!');
