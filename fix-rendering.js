const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

// Replace table cell
c = c.replace(/\{s\.service_type_ids && Array\.isArray\(s\.service_type_ids\)(?:.|\n)*?\?\s*s\.service_type_ids\.map.*?\n.*?: \(s\.service_type \|\| 'N\/A'\)\}/g,
  "{s.service_type || 'N/A'}");

// Replace viewService modal
c = c.replace(/\{viewService\.service_type_ids(?:.|\n)*?viewService\.service_type \|\| 'N\/A'\)\}/g,
  "{viewService.service_type || 'N/A'}");

// Clean up unused state
c = c.replace(/const \[docServiceTypes, setDocServiceTypes\] = useState<any\[\]>\(\[\]\);/g, '');

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed rendering logic');
