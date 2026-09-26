const fs = require('fs');

// customers/new/page.tsx
let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');

cNew = cNew.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/,
  "const [services, setServices] = useState<any[]>([]);\n  const [docServices, setDocServices] = useState<any[]>([]);");

cNew = cNew.replace(/service: '',/, "service: '',\n    service_type: [] as string[],");

cNew = cNew.replace(/const \{ data, error \} = await supabaseAuth\.from\('services'\)\.select\('\*'\);/,
  `const [sRes, dRes] = await Promise.all([
        supabaseAuth.from('services').select('*'),
        supabaseAuth.from('doc_service_types').select('*')
      ]);
      const data = sRes.data;
      const error = sRes.error;
      if (dRes.data) setDocServices(dRes.data);`);

const docUI = `
            {isGeneral && (
              <div className={styles.formGroup}>
                <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
                <select multiple name="service_type" value={formData.service_type || []} onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFormData({...formData, service_type: selected});
                }} style={{ height: '80px' }}>
                  {docServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
`;

cNew = cNew.replace(/<div className=\{styles\.formGroup\}>\s*<label>Select Service \*\s*<\/label>[\s\S]*?<\/select>\s*<\/div>/, `$&` + docUI);

fs.writeFileSync('src/app/customers/new/page.tsx', cNew);

// customers/[id]/page.tsx
let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

cId = cId.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/,
  "const [services, setServices] = useState<any[]>([]);\n  const [docServices, setDocServices] = useState<any[]>([]);");

cId = cId.replace(/const sRes = await supabaseAuth\.from\('services'\)\.select\('\*'\);/,
  `const sRes = await supabaseAuth.from('services').select('*');
      const dRes = await supabaseAuth.from('doc_service_types').select('*');
      if (dRes.data) setDocServices(dRes.data);`);

cId = cId.replace(/<div className=\{styles\.formGroup\}>\s*<label>Select Service \*\s*<\/label>[\s\S]*?<\/select>\s*<\/div>/, `$&` + docUI.replace(/formData/g, 'customer').replace('setFormData({...formData', 'setCustomer({...customer'));

fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);
console.log('Fixed forms');
