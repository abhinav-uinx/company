const fs = require('fs');
let c = fs.readFileSync('src/app/actions/auth.ts', 'utf8');

const injectionStr = `export async function login(inputVal: string, password: string) {
    // Check rate limit first
    const { data: attemptData } = await supabaseAdmin.from('login_attempts').select('*').eq('identifier', inputVal).single();
    
    if (attemptData && attemptData.lockout_until) {
        const lockoutTime = new Date(attemptData.lockout_until).getTime();
        const now = Date.now();
        if (lockoutTime > now) {
            return { success: false, error: 'Too many attempts. Account locked.', lockout_until: attemptData.lockout_until };
        } else if (attemptData.attempts >= 10) {
            await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
        }
    }`;

c = c.replace('export async function login(inputVal: string, password: string) {', injectionStr);

const handleFailStr = `// Handle Failure
    const currentAttempts = attemptData ? attemptData.attempts + 1 : 1;
    const updates: any = { identifier: inputVal, attempts: currentAttempts, last_attempt: new Date().toISOString() };
    if (currentAttempts >= 10) {
        updates.lockout_until = new Date(Date.now() + 60 * 1000).toISOString();
    }
    await supabaseAdmin.from('login_attempts').upsert([updates]);
    
    if (currentAttempts >= 10) {
        return { success: false, error: 'Too many attempts. Account locked for 1 minute.', lockout_until: updates.lockout_until };
    }
    return { success: false, error: 'Invalid credentials. ' + (10 - currentAttempts) + ' attempts remaining.' };`;

c = c.replace("return { success: false, error: 'Invalid credentials' };", handleFailStr);

const handleSuccessAdmin = `if (attemptData && attemptData.attempts > 0) {
            await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
        }
        await createSession(adminMatch.username, 'admin');`;
c = c.replace("await createSession(adminMatch.username, 'admin');", handleSuccessAdmin);

const handleSuccessEmp = `if (attemptData && attemptData.attempts > 0) {
            await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
        }
        await createSession(empMatch.iqama_number, 'employee');`;
c = c.replace("await createSession(empMatch.iqama_number, 'employee');", handleSuccessEmp);

fs.writeFileSync('src/app/actions/auth.ts', c);
console.log('Added rate limiting logic to auth.ts properly');
