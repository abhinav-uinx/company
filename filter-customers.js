const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/const \[sRes, pRes, tRes\] = await Promise\.all\(\[\n\s*supabaseAuth\.from\('documentation_services'\)\.select\('\*, customers\(name\)'\)\.order\('created_at', \{ ascending: false \}\),\n\s*supabaseAuth\.from\('customers'\)\.select\('id, name'\),\n\s*supabaseAuth\.from\('doc_service_types'\)\.select\('\*'\)\n\s*\]\);/,
`const { data: genService } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      const [sRes, pRes, tRes] = await Promise.all([
        supabaseAuth.from('documentation_services').select('*, customers(name)').order('created_at', { ascending: false }),
        supabaseAuth.from('customers').select('id, name').contains('service_ids', [genService?.id]),
        supabaseAuth.from('doc_service_types').select('*')
      ]);`);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Filtered customers in documentation');
