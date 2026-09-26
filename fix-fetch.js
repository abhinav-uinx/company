const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/const \[sRes, pRes, tRes\] = await Promise\.all\(\[\s*supabaseAuth\.from\('documentation_services'\)\.select\('\*, customers\(name\)'\)\.order\('created_at', \{ ascending: false \}\),\s*supabaseAuth\.from\('customers'\)\.select\('id, name'\),\s*supabaseAuth\.from\('doc_service_types'\)\.select\('\*'\)\s*\]\);/,
`const { data: genService } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      const [sRes, pRes] = await Promise.all([
        supabaseAuth.from('documentation_services').select('*, customers(name)').order('created_at', { ascending: false }),
        supabaseAuth.from('customers').select('id, name').eq('service', genService?.id)
      ]);`);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed fetch');
