const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

c = c.replace(/delete payload\.customer_id;/, 'delete (payload as any).customer_id;');

fs.writeFileSync('src/app/documentation/new/page.tsx', c);
console.log('Fixed typescript delete error');
