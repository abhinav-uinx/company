const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

const backLink = `      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500, marginBottom: '20px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          Back to Dashboard
        </Link>
        <div className="page-header">`;

c = c.replace(/<div style=\{\{ maxWidth: '1200px', margin: '0 auto', padding: '24px' \}\}>\s*<div className="page-header">/, backLink);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Added back to dashboard button');
