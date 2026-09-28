const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

const regex = /const \{ data: sessionRecord \} = await supabaseAdmin\.from\('active_sessions'\)[\s\S]*?\.single\(\);\s*if \(!sessionRecord \|\| !sessionRecord\.is_active\) \{\s*cookies\(\)\.delete\('session'\);\s*return null;\s*\}/;

const replacement = `const { data: sessionRecord, error: sessionErr } = await supabaseAdmin.from('active_sessions').select('is_active').eq('id', payload.session_id).single();
          if (sessionErr) {
             // Do not destroy the cookie on a database timeout or error!
          } else if (sessionRecord && sessionRecord.is_active === false) {
              cookies().delete('session');
              return null;
          }`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/app/actions/auth.ts', c);
console.log('Fixed auth');
