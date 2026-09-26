const fs = require('fs');

// 1. Delete documentation folder again
fs.rmSync('src/app/documentation', { recursive: true, force: true });

// 2. Update Dashboard (remove doc card) again
let dash = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

dash = dash.replace(/<div className="service-card" onClick=\{\(\) => router\.push\('\/documentation'\)\} style=\{\{ cursor: 'pointer'[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '</div>\n          </div>');

fs.writeFileSync('src/app/dashboard/page.tsx', dash);
console.log('Undid the documentation tracker creation');
