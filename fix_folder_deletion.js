const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

const replacement = `if (bucket) {
           const { data: pList } = await supabaseAuth.storage.from(bucket).list(id + '/passport');
           if (pList && pList.length > 0) {
             await supabaseAuth.storage.from(bucket).remove(pList.map(f => id + '/passport/' + f.name));
           }
           const { data: tList } = await supabaseAuth.storage.from(bucket).list(id + '/ticket');
           if (tList && tList.length > 0) {
             await supabaseAuth.storage.from(bucket).remove(tList.map(f => id + '/ticket/' + f.name));
           }
        }`;

c = c.replace(/if \(bucket\) \{[\s\S]*?\}\n        \}/, replacement);
fs.writeFileSync('src/app/customers/page.tsx', c);
console.log('Fixed folder deletion');
