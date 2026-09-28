const fs = require('fs');

function fixLinks(filePath) {
    if (!fs.existsSync(filePath)) return;
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Top nav Reports link
    c = c.replace(/<Link className="navlink" href="\/admin\/reports">Reports<\/Link>/g, 
        "{userRole === 'admin' && <Link className=\"navlink\" href=\"/admin/reports\">Reports</Link>}");
    
    // Reports & Excel Export card
    const cardRegex = /<div className="service-card" onClick=\{\(\) => router\.push\('\/admin\/reports'\)\} style=\{\{ cursor: 'pointer' \}\}>[\s\S]*?<\/div>\s*<div className="service-card"/;
    const match = c.match(cardRegex);
    if (match) {
        // We only want to wrap the first div in {userRole === 'admin' && ( ... )}
        const cardStr = match[0].replace('</div>\n          <div className="service-card"', '</div>');
        c = c.replace(cardStr, `{userRole === 'admin' && (\n          ${cardStr.trim()}\n          )}`);
    }

    // Since the previous regex is a bit complex, let's just do it directly with standard string manipulation
    const startIdx = c.indexOf('<div className="service-card" onClick={() => router.push(\'/admin/reports\')}');
    if (startIdx !== -1) {
        const endStr = '<h3>Reports &amp; Excel Export</h3>\n            <Link className="service-open group" href="/admin/reports"><span className="material-symbols-outlined -rotate-45 group-hover:rotate-0 transition-transform duration-300">arrow_forward</span></Link>\n          </div>';
        const endIdx = c.indexOf(endStr, startIdx) + endStr.length;
        if (endIdx > startIdx) {
            const cardStr = c.substring(startIdx, endIdx);
            c = c.substring(0, startIdx) + `{userRole === 'admin' && (\n          ${cardStr}\n          )}` + c.substring(endIdx);
        }
    }

    // Bottom nav Reports link
    c = c.replace(/<Link href="\/admin\/reports" className="bottom-nav-item">[\s\S]*?<\/Link>/, 
        "{userRole === 'admin' && (\n          <Link href=\"/admin/reports\" className=\"bottom-nav-item\">\n            <span className=\"material-symbols-outlined\">bar_chart</span>\n            <span>Reports</span>\n          </Link>\n        )}");

    fs.writeFileSync(filePath, c);
}

fixLinks('src/app/user/dashboard/page.tsx');
fixLinks('src/app/admin/dashboard/page.tsx');
console.log('Fixed reports links');
