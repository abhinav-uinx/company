const fs = require('fs');

// 1. Update customers/new/page.tsx
let newPage = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');

// Add state for docServices
newPage = newPage.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/,
  "const [services, setServices] = useState<any[]>([]);\n  const [docServices, setDocServices] = useState<any[]>([]);");

// Add formData for doc_service_ids
newPage = newPage.replace(/service_ids: \[\] as string\[\],/,
  "service_ids: [] as string[],\n    doc_service_ids: [] as string[],");

// Update fetch
newPage = newPage.replace(/const \{ data, error \} = await supabaseAuth\.from\('services'\)\.select\('\*'\);/,
  `const [sRes, dRes] = await Promise.all([
        supabaseAuth.from('services').select('*'),
        supabaseAuth.from('doc_service_types').select('*')
      ]);
      const data = sRes.data;
      const error = sRes.error;
      if (dRes.data) setDocServices(dRes.data);`);

// Insert the new multi-select UI
const docUI = `
          <div className={styles.formGroup}>
            <label>Documentation Services</label>
            <select multiple name="doc_service_ids" value={formData.doc_service_ids} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFormData({...formData, doc_service_ids: selected});
            }} style={{ height: '80px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
`;

newPage = newPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Service Type \*\s*<\/label>[\s\S]*?<\/select>\s*<\/div>/, `$&` + docUI);

fs.writeFileSync('src/app/customers/new/page.tsx', newPage);

// 2. Update customers/[id]/page.tsx
let idPage = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

// Add state for docServices
idPage = idPage.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/,
  "const [services, setServices] = useState<any[]>([]);\n  const [docServices, setDocServices] = useState<any[]>([]);");

// Update fetch
idPage = idPage.replace(/const sRes = await supabaseAuth\.from\('services'\)\.select\('\*'\);/,
  `const sRes = await supabaseAuth.from('services').select('*');
      const dRes = await supabaseAuth.from('doc_service_types').select('*');
      if (dRes.data) setDocServices(dRes.data);`);

// Insert the UI
idPage = idPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Service Type \*\s*<\/label>[\s\S]*?<\/select>\s*<\/div>/, `$&` + docUI.replace('formData', 'customer').replace('setFormData({...formData', 'setCustomer({...customer'));

fs.writeFileSync('src/app/customers/[id]/page.tsx', idPage);
console.log('Fixed new and id page');
