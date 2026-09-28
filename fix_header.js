const fs = require('fs');

function fixHeader(filePath) {
    if (!fs.existsSync(filePath)) return;
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Replace the static string with a dynamic one based on userRole
    c = c.replace(/<span>Employee &amp; Admin Records Portal<\/span>/g, "<span>{userRole === 'admin' ? 'Admin Records Portal' : 'Employee Records Portal'}</span>");
    
    fs.writeFileSync(filePath, c);
}

fixHeader('src/app/user/dashboard/page.tsx');
fixHeader('src/app/admin/dashboard/page.tsx');
console.log('Fixed headers');
