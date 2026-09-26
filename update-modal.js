const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

if (!c.includes('>Iqama Number</div>')) {
  const html = `                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Iqama Number</div>
                    <div style={{ color: '#0f172a', fontWeight: 500 }}>{viewCustomer.iqama_number || 'N/A'}</div>
                  </div>`;
  c = c.replace(/<div style=\{\{ fontSize: '0\.75rem', color: '#64748b', marginBottom: '4px' \}\}>Date of Birth<\/div>/, html + '\n                  <div style={{ background: \'#f8fafc\', padding: \'12px\', borderRadius: \'12px\', border: \'1px solid #f1f5f9\' }}>\n                    <div style={{ fontSize: \'0.75rem\', color: \'#64748b\', marginBottom: \'4px\' }}>Date of Birth</div>');
  fs.writeFileSync('src/app/customers/page.tsx', c);
}
console.log('Added Iqama to view modal');
