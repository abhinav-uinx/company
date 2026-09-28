const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

const target = `          const { data: sessionRecord } = await supabaseAdmin.from('active_sessions')
              .select('is_active')
              .eq('id', payload.session_id)
              .single();
              
          if (!sessionRecord || !sessionRecord.is_active) {
              cookies().delete('session');
              return null;
          }`;

const repl = `          const { data: sessionRecord, error: sessionErr } = await supabaseAdmin.from('active_sessions')
              .select('is_active')
              .eq('id', payload.session_id)
              .single();
              
          if (sessionErr) {
              // Ignore DB errors to prevent accidental logouts
          } else if (sessionRecord && sessionRecord.is_active === false) {
              cookies().delete('session');
              return null;
          }`;

c = c.replace(target, repl);
fs.writeFileSync('src/app/actions/auth.ts', c);
console.log('Fixed auth exactly');
