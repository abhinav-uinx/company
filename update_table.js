const fs = require('fs');
let cPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

cPage = cPage.replace(/\{customer\.service_ids && customer\.service_ids\.length > 0(?:.|\n)*?None'\}/,
  `{customer.service ? services.find(s => s.id === customer.service)?.name || 'Unknown' : 'None'}`);

fs.writeFileSync('src/app/customers/page.tsx', cPage);
console.log('Fixed table');
