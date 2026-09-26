const fs = require('fs');

const cssFiles = [
  'src/app/customers/customers.module.css',
  'src/app/escorts/escorts.module.css',
  'src/app/documentation/documentation.module.css'
];

cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let css = fs.readFileSync(file, 'utf8');
    
    if (!css.includes('@media (max-width: 600px)')) {
      css += `\n@media (max-width: 600px) {\n  .header {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 15px;\n  }\n  .container {\n    padding: 20px 15px;\n  }\n}\n`;
      fs.writeFileSync(file, css);
    }
  }
});

let docPage = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');
if (!docPage.includes('@media (max-width: 600px)')) {
  docPage = docPage.replace('</style>', `
        @media (max-width: 600px) {
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 15px; }
        }
      </style>`);
  fs.writeFileSync('src/app/documentation/page.tsx', docPage);
}

console.log('Added responsive headers');
