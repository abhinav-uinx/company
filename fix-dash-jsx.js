const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Find and remove lines 116-118 by line number approach
const lines = c.split('\n');
const filtered = lines.filter(line => {
  if (line.includes('Medical Escort Service') && line.includes('h3')) return false;
  if (line.includes('/medif/new') && line.includes('service-open')) return false;
  return true;
});

// Also remove the dangling closing </div> that was the old card opener
// Find the invoices </div> that now has orphaned content after it
let result = filtered.join('\n');
result = result.replace(/<\/div>\s*<\/div>(\s*\n\s*<div className="service-card" onClick=\{.+vault)/, '</div>\n\n          <div className="service-card" onClick={() => router.push(\'/vault\')');

fs.writeFileSync('src/app/dashboard/page.tsx', result);
console.log('Fixed orphaned JSX');
