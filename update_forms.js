const fs = require('fs');

// 1. customers/new/page.tsx
let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
cNew = cNew.replace(/service_ids: \[\] as string\[\],/, "service: '',");
cNew = cNew.replace(/<select multiple required value=\{formData\.service_ids\}(?:.|\n)*?<\/select>/, `<select required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>`);
cNew = cNew.replace(/const selectedService = services\.find\(s => formData\.service_ids\.includes\(s\.id\)\);/g, 'const selectedService = services.find(s => s.id === formData.service);');
fs.writeFileSync('src/app/customers/new/page.tsx', cNew);

// 2. customers/[id]/page.tsx
let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
cId = cId.replace(/service_ids: \[\] as string\[\],/, "service: '',");
cId = cId.replace(/<select multiple required value=\{customer\.service_ids \|\| \[\]\}(?:.|\n)*?<\/select>/, `<select required value={customer.service || ''} onChange={(e) => setCustomer({...customer, service: e.target.value})}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>`);
cId = cId.replace(/const selectedService = services\.find\(s => \(customer\.service_ids \|\| \[\]\)\.includes\(s\.id\)\);/g, 'const selectedService = services.find(s => s.id === customer.service);');
fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);

console.log('Fixed new and edit');
