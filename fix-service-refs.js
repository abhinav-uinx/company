const fs = require('fs');

// NEW PAGE
let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
cNew = cNew.replace(/service_id: '',/g, ''); 
cNew = cNew.replace(/service_ids/g, 'service'); 
cNew = cNew.replace(/service: \[\] as string\[\],/g, "service: '',");
cNew = cNew.replace(/formData\.service\.some/g, '[formData.service].some');
fs.writeFileSync('src/app/customers/new/page.tsx', cNew);

// ID PAGE
let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
cId = cId.replace(/service_id/g, 'service'); 
cId = cId.replace(/service_ids/g, 'service'); 
cId = cId.replace(/customer\.service\.some/g, '[customer.service].some'); 
fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);

console.log('Fixed everything');
