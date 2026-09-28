const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace("redirect('/login');\n  }", "console.error('JWT Verify Error:', error);\n    redirect('/login');\n  }");

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Added error logging');
