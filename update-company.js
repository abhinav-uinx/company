const fs = require('fs');

const files = [
  'src/app/dashboard/page.tsx',
  'src/app/directory/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');

  // Topbar
  c = c.replace(
    /Internal system — Your Company Name employees and administrators only/g,
    'Internal system — Medescort International employees and administrators only'
  );

  // Replace SVG icon + brand text
  c = c.replace(
    /<svg className="brand-mark"[\s\S]*?<\/svg>/,
    `<img src="/Assets/Company logo/main_logo.png" alt="Medescort Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />`
  );

  // Replace company name text
  c = c.replace(/Your Company Name/g, 'Medescort International');

  fs.writeFileSync(f, c);
  console.log('Updated:', f);
});

// Fix invoices
let inv = fs.readFileSync('src/app/invoices/[id]/page.tsx', 'utf8');
inv = inv.replace(/YOUR COMPANY NAME/g, 'Medescort International');
fs.writeFileSync('src/app/invoices/[id]/page.tsx', inv);
console.log('Updated: invoices/[id]/page.tsx');
