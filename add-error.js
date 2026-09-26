const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');
c = c.replace(/if \(sRes\.data\) \{/, 'if (sRes.error) setDebugError(JSON.stringify(sRes.error));\n      if (tRes.error) setDebugError(JSON.stringify(tRes.error));\n      if (sRes.data) {');
c = c.replace(/<div className=\{styles\.header\}>/, '{debugError && <div style={{background: "red", color: "white", padding: "10px", margin: "10px"}}>Error: {debugError}</div>}\n          <div className={styles.header}>');
fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed');
