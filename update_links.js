const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) callback(dirPath);
  });
}

const replacements = {
  '/dashboard': '/user/dashboard',
  '/customers': '/user/customers',
  '/escorts': '/user/escorts',
  '/documentation': '/user/documentation',
  '/invoices': '/user/invoices',
  '/vault': '/user/vault',
  '/directory': '/admin/directory',
  '/reports': '/admin/reports',
  '/sessions': '/admin/sessions'
};

function replaceLinks(filePath, isAdminContext) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [oldPath, newPath] of Object.entries(replacements)) {
    let targetPath = newPath;
    if (oldPath === '/dashboard') {
      targetPath = isAdminContext ? '/admin/dashboard' : '/user/dashboard';
    }

    // Replace href="/path"
    content = content.split('href="' + oldPath).join('href="' + targetPath);
    content = content.split("href='" + oldPath).join("href='" + targetPath);
    
    // Replace router.push('/path')
    content = content.split("('" + oldPath).join("('" + targetPath);
    content = content.split('("' + oldPath).join('("' + targetPath);
    
    // Replace template literals (`/path/...`)
    content = content.split('(`' + oldPath).join('(`' + targetPath);
    content = content.split('${`' + oldPath).join('${`' + targetPath);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated links in: ' + filePath);
  }
}

walkDir(path.join(process.cwd(), 'src/app/admin'), (f) => replaceLinks(f, true));
walkDir(path.join(process.cwd(), 'src/app/user'), (f) => replaceLinks(f, false));

console.log('Navigation links updated.');
