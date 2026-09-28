const fs = require('fs');
let c = fs.readFileSync('src/app/api/supabase/[[...path]]/route.ts', 'utf8');

const regex = /if \(req\.method !== 'GET' && req\.method !== 'HEAD'\) \{[\s\S]*?fetchOptions\.body = buffer;\n  \}/;

const replacement = `if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = req.body;
    // @ts-ignore
    fetchOptions.duplex = 'half';
  }`;

c = c.replace(regex, replacement);

fs.writeFileSync('src/app/api/supabase/[[...path]]/route.ts', c);
console.log('Fixed proxy to use binary stream forwarding!');
