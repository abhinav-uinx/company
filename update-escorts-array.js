const fs = require('fs');

let c = fs.readFileSync('src/app/escorts/new/page.tsx', 'utf8');

c = c.replace(/const \[pRes, eRes\] = await Promise\.all\(\[\n\s*supabaseAuth\.from\('customers'\)\.select\('id, name, services!inner\(name\)'\)\.eq\('services\.name', 'Medical Escort'\),\n\s*supabaseAuth\.from\('employees'\)\.select\('iqama_number, name'\)\.eq\('status', 'active'\)\n\s*\]\);/,
`const { data: sData } = await supabaseAuth.from('services').select('id').eq('name', 'Medical Escort').single();
      const [pRes, eRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name').contains('service_ids', [sData?.id]),
        supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active')
      ]);`);

fs.writeFileSync('src/app/escorts/new/page.tsx', c);

// Also check escorts/[id]/page.tsx just in case it has the same query
if (fs.existsSync('src/app/escorts/[id]/page.tsx')) {
  let idC = fs.readFileSync('src/app/escorts/[id]/page.tsx', 'utf8');
  idC = idC.replace(/const \[pRes, eRes\] = await Promise\.all\(\[\n\s*supabaseAuth\.from\('customers'\)\.select\('id, name, services!inner\(name\)'\)\.eq\('services\.name', 'Medical Escort'\),\n\s*supabaseAuth\.from\('employees'\)\.select\('iqama_number, name'\)\.eq\('status', 'active'\)\n\s*\]\);/,
  `const { data: sData } = await supabaseAuth.from('services').select('id').eq('name', 'Medical Escort').single();
      const [pRes, eRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name').contains('service_ids', [sData?.id]),
        supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active')
      ]);`);
  fs.writeFileSync('src/app/escorts/[id]/page.tsx', idC);
}

console.log('Fixed escorts');
