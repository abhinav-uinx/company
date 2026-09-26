const fs = require('fs');

// 1. Update customers/page.tsx
let cPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

if (!cPage.includes('const [services, setServices] = useState<any[]>([])')) {
  cPage = cPage.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(true);\n  const [services, setServices] = useState<any[]>([]);");
}
cPage = cPage.replace(/const \{ data, error \} = await supabaseAuth\n\s*\.from\('customers'\)\n\s*\.select\('\*, services\(name\)'\)/,
`const [cRes, sRes] = await Promise.all([
      supabaseAuth.from('customers').select('*').order('created_at', { ascending: false }),
      supabaseAuth.from('services').select('*')
    ]);
    if (sRes.data) setServices(sRes.data);
    const data = cRes.data;
    const error = cRes.error;`);

cPage = cPage.replace(/<td>\{customer\.services\?\.name \|\| 'Unassigned'\}<\/td>/g, 
`<td>{customer.service_ids && customer.service_ids.length > 0 ? customer.service_ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ') : (customer.services?.name || 'Unassigned')}</td>`);

fs.writeFileSync('src/app/customers/page.tsx', cPage);
console.log('Fixed customers page');

// 2. Update customers/new/page.tsx
let newPage = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
newPage = newPage.replace(/service_id: '',/, "service_ids: [] as string[],");
newPage = newPage.replace(/<select name="service_id" required value=\{formData\.service_id \|\| ''\} onChange=\{handleChange\}>/,
`<select multiple name="service_ids" required value={formData.service_ids} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFormData({...formData, service_ids: selected});
            }} style={{ height: '80px' }}>`);

// Conditionally check if 'General Service' is inside the array
newPage = newPage.replace(/const selectedService = services\.find\(s => s\.id === formData\.service_id\);\n\s*const isGeneral = selectedService && selectedService\.name === 'General Service';/,
`const isGeneral = formData.service_ids && formData.service_ids.some(id => services.find(s => s.id === id)?.name === 'General Service');`);

// Fix payload to remove service_id if it's not needed, or just let it pass
fs.writeFileSync('src/app/customers/new/page.tsx', newPage);
console.log('Fixed new page');

// 3. Update customers/[id]/page.tsx
let idPage = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

idPage = idPage.replace(/<select name="service_id" required value=\{formData\.service_id \|\| ''\} onChange=\{handleChange\}>/,
`<select multiple name="service_ids" required value={customer?.service_ids || []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setCustomer({...customer, service_ids: selected});
            }} style={{ height: '80px' }}>`);

idPage = idPage.replace(/const selectedService = services\.find\(s => s\.id === customer\?\.service_id\);\n\s*const isGeneral = selectedService && selectedService\.name === 'General Service';/,
`const isGeneral = customer?.service_ids && customer.service_ids.some(id => services.find(s => s.id === id)?.name === 'General Service');`);

fs.writeFileSync('src/app/customers/[id]/page.tsx', idPage);
console.log('Fixed id page');

