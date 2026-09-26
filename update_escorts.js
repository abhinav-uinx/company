const fs = require('fs');
let escPage = fs.readFileSync('src/app/escorts/new/page.tsx', 'utf8');

escPage = escPage.replace(/\.contains\('service_ids', \[sData\?\.id\]\)/, ".eq('service', sData?.id)");
fs.writeFileSync('src/app/escorts/new/page.tsx', escPage);
console.log('Fixed escorts');
