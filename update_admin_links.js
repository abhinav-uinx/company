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
  '/directory': '/admin/directory',
  '/reports': '/admin/reports',
  '/sessions': '/admin/sessions'
};

function replaceLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace back exactly what we had before, being careful not to replace things that are already /admin/
  // But wait, the previous script changed everything to /directory, so there are NO /admin/directory links left right now!
  // Except maybe AuthGuard? AuthGuard had /directory changed to /directory. 
  
  for (const [oldPath, newPath] of Object.entries(replacements)) {
    content = content.split('href="' + oldPath).join('href="' + newPath);
    content = content.split("href='" + oldPath).join("href='" + newPath);
    content = content.split("('" + oldPath).join("('" + newPath);
    content = content.split('("' + oldPath).join('("' + newPath);
    content = content.split('(`' + oldPath).join('(`' + newPath);
    content = content.split('${`' + oldPath).join('${`' + newPath);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated links in: ' + filePath);
  }
}

walkDir(path.join(process.cwd(), 'src/app'), replaceLinks);
walkDir(path.join(process.cwd(), 'src/components'), replaceLinks);

console.log('Admin links restored.');
