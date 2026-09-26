const fs = require('fs');

let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
cNew = cNew.replace(/const isGeneral = selectedService && selectedService\.name === 'General Service';/, `const selectedService = services.find(s => s.id === formData.service);\n  const isGeneral = selectedService && selectedService.name === 'General Service';`);
fs.writeFileSync('src/app/customers/new/page.tsx', cNew);

let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
cId = cId.replace(/const isGeneral = selectedService && selectedService\.name === 'General Service';/, `const selectedService = services.find(s => s.id === customer.service);\n  const isGeneral = selectedService && selectedService.name === 'General Service';`);
fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);

console.log('Fixed selectedService properly');
