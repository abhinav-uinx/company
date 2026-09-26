const fs = require('fs');
let docPage = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

docPage = docPage.replace(/\.contains\('service_ids', \[genService\?\.id\]\)/, ".eq('service', genService?.id)");
fs.writeFileSync('src/app/documentation/page.tsx', docPage);
console.log('Fixed documentation');
