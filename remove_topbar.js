const fs = require('fs');

const files = [
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/directory/page.tsx',
  'src/app/user/dashboard/page.tsx',
  'src/app/admin/directory/add_employee/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Use regex to match the topbar div and all its contents
    // The regex matches `<div className="topbar">` up to the next `</div>`
    const regex = /<div className="topbar">[\s\S]*?<\/div>\s*/g;
    content = content.replace(regex, '');
    
    fs.writeFileSync(file, content);
    console.log(`Removed topbar from ${file}`);
  }
}
