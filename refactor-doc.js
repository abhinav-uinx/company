const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

// 1. Add state for docServiceTypes
c = c.replace(/const \[customers, setCustomers\] = useState<any\[\]>\(\[\]\);/,
  "const [customers, setCustomers] = useState<any[]>([]);\n  const [docServiceTypes, setDocServiceTypes] = useState<any[]>([]);");

// 2. Change formData
c = c.replace(/service_type: 'New Passport Creation',/, "service_type_ids: [] as string[],");

// 3. Update fetchData
c = c.replace(/const \[sRes, pRes\] = await Promise\.all\(\[/,
  "const [sRes, pRes, tRes] = await Promise.all([");
c = c.replace(/supabaseAuth\.from\('customers'\)\.select\('id, name'\)/,
  "supabaseAuth.from('customers').select('id, name'),\n        supabaseAuth.from('doc_service_types').select('*')");
c = c.replace(/if \(pRes\.data\) setCustomers\(pRes\.data\);/,
  "if (pRes.data) setCustomers(pRes.data);\n      if (tRes.data) setDocServiceTypes(tRes.data);");

// 4. Update the multiselect UI
c = c.replace(/<label>Service Type \*(?:.|\n)*?<\/select>/,
`<label>Service Types (Hold Ctrl/Cmd to select multiple) *</label>
                  <select multiple required value={formData.service_type_ids} onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setFormData({...formData, service_type_ids: selected});
                  }} style={{ height: '100px' }}>
                    {docServiceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>`);

// 5. Update the table rendering to map UUIDs to names
c = c.replace(/<td>\{s\.service_type\}<\/td>/,
`<td>
                      {s.service_type_ids && Array.isArray(s.service_type_ids)
                        ? s.service_type_ids.map((id: string) => docServiceTypes.find(t => t.id === id)?.name).filter(Boolean).join(', ')
                        : (s.service_type || 'N/A')}
                    </td>`);

// 6. Update viewService rendering
c = c.replace(/\{viewService\.service_type\}/,
  "{viewService.service_type_ids && Array.isArray(viewService.service_type_ids) ? viewService.service_type_ids.map((id: string) => docServiceTypes.find(t => t.id === id)?.name).filter(Boolean).join(', ') : (viewService.service_type || 'N/A')}");

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed page');
