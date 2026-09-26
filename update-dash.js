const fs = require('fs');
let dash = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

if (!dash.includes('/documentation')) {
  dash = dash.replace(/<\/div>\s*<\/div>\s*<\/div>/, 
`  <div className="service-card" onClick={() => router.push('/documentation')} style={{ cursor: 'pointer', background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', color: '#0f172a' }}>Documentation</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>Manage general service requests and documents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`);
  fs.writeFileSync('src/app/dashboard/page.tsx', dash);
  console.log('Added to dashboard');
}
