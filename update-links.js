const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/href="\/customers\/new"/, 'href="/documentation/new"');
c = c.replace(/href=\{\`\/customers\/\$\{c\.id\}\`\}/g, 'href={`/documentation/${c.id}`}');
c = c.replace(/href=\{\`\/customers\/\$\{viewCustomer\.id\}\`\}/g, 'href={`/documentation/${viewCustomer.id}`}');

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed links in documentation page');
