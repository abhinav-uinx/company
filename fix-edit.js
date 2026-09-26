const fs = require('fs');

// [id]/page.tsx
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

c = c.replace(/formData\.service_id/g, 'customer?.service_id');
c = c.replace(/formData\.iqama_number/g, 'customer?.iqama_number');
c = c.replace(/const selectedService = services\.find\(s => s\.id === formData\.service_id\);\s*const isGeneral = selectedService && selectedService\.name === 'General Service';/, '');

c = c.replace(/return \(\n\s*<div className=\{styles\.container\}>/, 
`const selectedService = services.find(s => s.id === customer?.service_id);
  const isGeneral = selectedService && selectedService.name === 'General Service';

  return (
    <div className={styles.container}>`);

// Fix missing services fetch if it didn't get inserted
if (!c.includes('supabaseAuth.from(\'services\')')) {
    c = c.replace(/const \{ data \} = await supabaseAuth\.from\('customers'\)\.select\('\*'\)\.eq\('id', id\)\.single\(\);/,
`const { data } = await supabaseAuth.from('customers').select('*').eq('id', id).single();
      const sRes = await supabaseAuth.from('services').select('*');
      if (sRes.data) setServices(sRes.data);`);
}

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed [id]/page.tsx');
