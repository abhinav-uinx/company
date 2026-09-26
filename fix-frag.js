const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
c = c.replace("<div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>", "            </>\n          )}\n          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>");
fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed');
