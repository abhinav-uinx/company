const fs = require('fs');

const files = [
  'src/app/escorts/page.tsx',
  'src/app/customers/page.tsx',
  'src/app/invoices/page.tsx',
  'src/app/documentation/page.tsx',
  'src/app/vault/page.tsx',
  'src/app/admin/directory/page.tsx',
  'src/app/admin/reports/page.tsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    
    // Add import if missing and LoadingIcon was used
    if (c.includes('<LoadingIcon />') || c.includes('LoadingIcon')) {
      if (!c.includes('TableSkeleton')) {
        c = c.replace(/import LoadingIcon.*?;/, "import TableSkeleton from '@/components/TableSkeleton';\nimport LoadingIcon from '@/components/LoadingIcon';");
      }
      
      // Replace the loading state td content
      c = c.replace(/<td colSpan=\{[0-9]+\} style=\{\{ padding: '40px', position: 'relative', height: '200px' \}\}>\s*<LoadingIcon \/>\s*<\/td>/g, 
        (match) => {
          const colSpanMatch = match.match(/colSpan=\{([0-9]+)\}/);
          const cols = colSpanMatch ? colSpanMatch[1] : '5';
          return `<td colSpan={${cols}} style={{ padding: 0 }}><TableSkeleton cols={${cols}} /></td>`;
        });
        
      fs.writeFileSync(f, c);
      console.log('Replaced skeleton in ' + f);
    }
  }
}
