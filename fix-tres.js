const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/if \(tRes\.error\) setDebugError\(JSON\.stringify\(tRes\.error\)\);/g, '');
c = c.replace(/if \(tRes\.data\) setDocServiceTypes\(tRes\.data\);/g, '');

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed tRes');
