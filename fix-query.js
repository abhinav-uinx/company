const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

c = c.replace(/\.select\('\*'\)/, ".select('*, services(name)')");
c = c.replace(/supabaseAuth\.from\('customers'\)\.select\('\*, services\(name\)'\)/, "supabaseAuth.from('customers')");

fs.writeFileSync('src/app/customers/page.tsx', c);
