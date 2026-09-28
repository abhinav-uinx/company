const fs = require('fs');

function forceWrap(filePath) {
    if (!fs.existsSync(filePath)) return;
    let c = fs.readFileSync(filePath, 'utf8');

    const regex = /<div className="service-card" onClick=\{\(\) => router\.push\('\/admin\/reports'\)\} style=\{\{ cursor: 'pointer' \}\}>[\s\S]*?<h3>Reports &amp; Excel Export<\/h3>[\s\S]*?<\/div>/;
    
    const match = c.match(regex);
    if (match && !c.includes("{userRole === 'admin' && (\n" + match[0])) {
        c = c.replace(match[0], "{userRole === 'admin' && (\n" + match[0] + "\n)}");
        fs.writeFileSync(filePath, c);
    }
}

forceWrap('src/app/user/dashboard/page.tsx');
forceWrap('src/app/admin/dashboard/page.tsx');
console.log('Fixed reports card');
