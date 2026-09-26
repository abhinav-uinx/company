const fs = require('fs');

// customers/new/page.tsx
let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
cNew = cNew.replace(/const isGeneral = formData\.service_ids(?:.|\n)*?General Service'\);/, "const isGeneral = selectedService && selectedService.name === 'General Service';");
cNew = cNew.replace(/<select multiple name="service_ids" required value=\{formData\.service_ids\}(?:.|\n)*?<\/select>/, `<select name="service" required value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>`);
fs.writeFileSync('src/app/customers/new/page.tsx', cNew);

// customers/[id]/page.tsx
let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
cId = cId.replace(/const isGeneral = customer\.service_ids(?:.|\n)*?General Service'\);/, "const isGeneral = selectedService && selectedService.name === 'General Service';");
cId = cId.replace(/<select multiple name="service_ids" required value=\{customer\.service_ids \|\| \[\]\}(?:.|\n)*?<\/select>/, `<select name="service" required value={customer.service || ''} onChange={(e) => setCustomer({...customer, service: e.target.value})}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>`);
fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);

console.log('Fixed properly');
