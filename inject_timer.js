const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

if (!c.includes('useEffect')) {
    c = c.replace("import { useState, Suspense } from 'react';", "import { useState, useEffect, Suspense } from 'react';");
}

const stateStr = `const [password, setPassword] = useState('');
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [timerDisplay, setTimerDisplay] = useState('');`;
c = c.replace("const [password, setPassword] = useState('');", stateStr);

const hookStr = `const [timerDisplay, setTimerDisplay] = useState('');

    useEffect(() => {
        if (!lockoutUntil) return;
        const interval = setInterval(() => {
            const remaining = lockoutUntil - Date.now();
            if (remaining <= 0) {
                setLockoutUntil(null);
                setError('');
                clearInterval(interval);
            } else {
                setTimerDisplay(Math.ceil(remaining / 1000) + 's');
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockoutUntil]);`;
c = c.replace("const [timerDisplay, setTimerDisplay] = useState('');", hookStr);

c = c.replace("const res = await login(username, password);", "const res: any = await login(username, password);");

const errStr = `setError(res.error || 'Invalid credentials');
          if (res.lockout_until) {
              setLockoutUntil(new Date(res.lockout_until).getTime());
          }
          setLoading(false);`;
c = c.replace("setError(res.error || 'Invalid credentials');\n          setLoading(false);", errStr);

const uiErrStr = `{error && (
                <div style={{ marginBottom:'16px', padding:'11px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', color:'#b91c1c', fontSize:'0.875rem', textAlign:'center' }}>
                  {error}
                  {lockoutUntil && <div style={{marginTop: '5px', fontWeight: 'bold'}}>Try again in {timerDisplay}</div>}
                </div>
              )}`;
c = c.replace(/\{error && \([\s\S]*?<\/div>\s*\)\}/, uiErrStr);

c = c.replace("disabled={loading}", "disabled={loading || !!lockoutUntil}");
c = c.replace("cursor: loading ? 'not-allowed' : 'pointer'", "cursor: (loading || !!lockoutUntil) ? 'not-allowed' : 'pointer'");

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Added live timer to login page');
