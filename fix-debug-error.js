const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(true);\n  const [debugError, setDebugError] = useState<string | null>(null);");

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Added debugError');
