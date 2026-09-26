const fs = require('fs');

const files = [
  'src/app/admin/directory/attendance/page.tsx',
  'src/app/admin/directory/salary/page.tsx',
  'src/app/admin/reports/page.tsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import styles from '[.\/]+customers\/customers\.module\.css';/g, "import styles from '@/app/customers/customers.module.css';");
    fs.writeFileSync(f, c);
    console.log('Fixed ' + f);
  }
}
