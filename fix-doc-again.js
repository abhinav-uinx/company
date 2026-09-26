const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

// 1. Revert formData back to service_type
c = c.replace(/service_type_ids: \[\] as string\[\],/, "service_type: 'New Passport Creation',");

// 2. Remove docServiceTypes state entirely
c = c.replace(/const \[docServiceTypes, setDocServiceTypes\] = useState<any\[\]>\(\[\]\);\n\s*/, '');

// 3. Fix the fetchData logic to filter by General Service
const targetFetch = `const [sRes, pRes, tRes] = await Promise.all([
        supabaseAuth.from('documentation_services').select('*, customers(name)').order('created_at', { ascending: false }),
        supabaseAuth.from('customers').select('id, name'),
          supabaseAuth.from('doc_service_types').select('*')
      ]);`;
const newFetch = `const { data: genService } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      const [sRes, pRes] = await Promise.all([
        supabaseAuth.from('documentation_services').select('*, customers(name)').order('created_at', { ascending: false }),
        supabaseAuth.from('customers').select('id, name').eq('service', genService?.id)
      ]);`;
c = c.replace(targetFetch, newFetch);
c = c.replace(/if \(tRes\.error\) setDebugError\(JSON\.stringify\(tRes\.error\)\);\n\s*/, '');
c = c.replace(/if \(tRes\.data\) setDocServiceTypes\(tRes\.data\);\n\s*/, '');

// 4. Revert the select dropdown back to service_type
const targetSelect = /<label>Service Types \(Hold Ctrl\/Cmd to select multiple\) \*<\/label>(?:.|\n)*?<\/select>/;
const newSelect = `<label>Service Type *</label>
                  <select required value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})}>
                    <option>New Passport Creation</option>
                    <option>Visa Renewal</option>
                    <option>Medical Report Attestation</option>
                    <option>Police Clearance Certificate</option>
                    <option>Translation Services</option>
                    <option>Legalization</option>
                    <option>Medical Certificate</option>
                  </select>`;
c = c.replace(targetSelect, newSelect);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed documentation');
