const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/await supabaseAuth\.from\('documentation_services'\)\.insert\(\[payload\]\);/,
`const { error: insErr } = await supabaseAuth.from('documentation_services').insert([payload]);
    if (insErr) {
      setDebugError("Insert Error: " + JSON.stringify(insErr));
      return;
    }`);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Added error handling to insert');
