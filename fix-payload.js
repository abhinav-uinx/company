const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

c = c.replace(/const payload = \{\s*\.\.\.formData,\s*service: genServiceId\s*\};/, 
`const payload = {
        ...formData,
        service: genServiceId
      };
      delete payload.customer_id;`);

fs.writeFileSync('src/app/documentation/new/page.tsx', c);
console.log('Fixed payload');
