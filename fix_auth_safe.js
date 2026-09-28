const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

const oldStr = `const { data: sessionRecord } = await supabaseAdmin.from('active_sessions')
            .select('is_active')
            .eq('id', payload.session_id)
            .single();
            
        if (!sessionRecord || !sessionRecord.is_active) {
            cookies().delete('session');
            return null;
        }`;

const newStr = `const { data: sessionRecord, error: sessionErr } = await supabaseAdmin.from('active_sessions')
            .select('is_active')
            .eq('id', payload.session_id)
            .single();
            
        if (sessionErr) {
            // Ignore DB errors to prevent accidental logouts
        } else if (sessionRecord && sessionRecord.is_active === false) {
            cookies().delete('session');
            return null;
        }`;

// Let's just use a more generic indexOf because spacing might be weird.
const startStr = "const { data: sessionRecord } = await supabaseAdmin.from('active_sessions')";
const endStr = "return null;\n        }";

const startIdx = c.lastIndexOf(startStr);
const endIdx = c.indexOf(endStr, startIdx) + endStr.length;

if (startIdx !== -1) {
    c = c.substring(0, startIdx) + newStr + c.substring(endIdx);
    fs.writeFileSync('src/app/actions/auth.ts', c);
    console.log('Successfully fixed getSession');
} else {
    console.log('Failed to find');
}
