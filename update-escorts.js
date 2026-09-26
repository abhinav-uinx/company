const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/supabaseAuth\.from\('customers'\)\.select\('id, name'\)/, "supabaseAuth.from('customers').select('id, name, services!inner(name)').eq('services.name', 'Medical Escort')");
  fs.writeFileSync(file, c);
}

fix('src/app/escorts/new/page.tsx');
fix('src/app/escorts/[id]/page.tsx');
console.log('Fixed escorts');
