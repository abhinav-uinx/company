const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) callback(dirPath);
  });
}

const replacements = {
  '/user/customers': '/customers',
  '/user/escorts': '/escorts',
  '/user/documentation': '/documentation',
  '/user/invoices': '/invoices',
  '/user/vault': '/vault',
  '/admin/directory': '/directory',
  '/admin/reports': '/reports',
  '/admin/sessions': '/sessions'
};

function replaceLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [oldPath, newPath] of Object.entries(replacements)) {
    // Replace href="/path"
    content = content.split('href="' + oldPath).join('href="' + newPath);
    content = content.split("href='" + oldPath).join("href='" + newPath);
    
    // Replace router.push('/path')
    content = content.split("('" + oldPath).join("('" + newPath);
    content = content.split('("' + oldPath).join('("' + newPath);
    
    // Replace template literals (`/path/...`)
    content = content.split('(`' + oldPath).join('(`' + newPath);
    content = content.split('${`' + oldPath).join('${`' + newPath);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated links in: ' + filePath);
  }
}

// Walk through ALL files in src/app
walkDir(path.join(process.cwd(), 'src/app'), replaceLinks);

// Also need to check src/components (AuthGuard.tsx etc)
walkDir(path.join(process.cwd(), 'src/components'), replaceLinks);

console.log('Navigation links reverted.');
