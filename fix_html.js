const fs = require('fs');

const files = [
  'src/app/escorts/page.tsx',
  'src/app/customers/page.tsx',
  'src/app/invoices/page.tsx',
  'src/app/documentation/page.tsx',
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  
  // Replace the entire <tr> containing the LoadingIcon
  c = c.replace(/<tr>\s*<td colSpan=\{([0-9]+)\} style=\{\{ padding: 0 \}\}>\s*<TableSkeleton cols=\{[0-9]+\} \/>\s*<\/td>\s*<\/tr>/g, '<TableSkeleton cols={$1} />');
  
  fs.writeFileSync(f, c);
  console.log('Fixed HTML validity in ' + f);
}
