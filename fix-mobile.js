const fs = require('fs');

const cssFiles = [
  'src/app/customers/customers.module.css',
  'src/app/escorts/escorts.module.css',
  'src/app/documentation/documentation.module.css'
];

cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let css = fs.readFileSync(file, 'utf8');
    
    // Change card overflow
    css = css.replace(/\.card\s*\{[^}]*overflow:\s*hidden;[^}]*\}/g, (match) => {
      return match.replace('overflow: hidden;', 'overflow-x: auto;\n  -webkit-overflow-scrolling: touch;');
    });
    
    // Make sure table has min-width
    if (!css.includes('min-width: 800px')) {
      css = css.replace(/\.table\s*\{[^}]*width:\s*100%;/g, (match) => {
        return match + '\n  min-width: 800px;';
      });
    }

    fs.writeFileSync(file, css);
  }
});

console.log('Patched CSS modules');

// Now fix inline CSS in documentation/page.tsx
let docPage = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');
if (!docPage.includes('min-width: 800px')) {
  docPage = docPage.replace(/\.table-container\s*\{[\s\S]*?overflow:\s*hidden;/g, (match) => {
    return match.replace('overflow: hidden;', 'overflow-x: auto; -webkit-overflow-scrolling: touch;');
  });
  docPage = docPage.replace(/\.data-table\s*\{[^}]*width:\s*100%;/g, (match) => {
    return match + ' min-width: 800px;';
  });
  fs.writeFileSync('src/app/documentation/page.tsx', docPage);
  console.log('Patched inline doc CSS');
}

