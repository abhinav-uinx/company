const fs = require('fs');

// Revert customers/page.tsx
let cPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');
cPage = cPage.replace(/const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);\n\s*/, '');
cPage = cPage.replace(/, dRes/, '');
cPage = cPage.replace(/,\n\s*supabaseAuth\.from\('doc_service_types'\)\.select\('\*'\)/, '');
cPage = cPage.replace(/if \(dRes\.data\) setDocServices\(dRes\.data\);\n\s*/, '');
cPage = cPage.replace(/<th>Main Services<\/th>\n\s*<th>Documentation Services<\/th>/, '<th>Services</th>');
cPage = cPage.replace(/<td>\n\s*\{customer\.doc_service_ids[\s\S]*?<\/td>/, '');
fs.writeFileSync('src/app/customers/page.tsx', cPage);

// Revert customers/new/page.tsx
let newPage = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
newPage = newPage.replace(/const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);\n\s*/, '');
newPage = newPage.replace(/doc_service_ids: \[\] as string\[\],\n\s*/, '');
newPage = newPage.replace(/const \[sRes, dRes\] = await Promise\.all\(\[\n\s*supabaseAuth\.from\('services'\)\.select\('\*'\),\n\s*supabaseAuth\.from\('doc_service_types'\)\.select\('\*'\)\n\s*\]\);\n\s*const data = sRes\.data;\n\s*const error = sRes\.error;\n\s*if \(dRes\.data\) setDocServices\(dRes\.data\);/, "const { data, error } = await supabaseAuth.from('services').select('*');");
newPage = newPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Documentation Services<\/label>[\s\S]*?<\/select>\s*<\/div>/, '');
fs.writeFileSync('src/app/customers/new/page.tsx', newPage);

// Revert customers/[id]/page.tsx
let idPage = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
idPage = idPage.replace(/const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);\n\s*/, '');
idPage = idPage.replace(/const dRes = await supabaseAuth\.from\('doc_service_types'\)\.select\('\*'\);\n\s*if \(dRes\.data\) setDocServices\(dRes\.data\);/, '');
idPage = idPage.replace(/<div className=\{styles\.formGroup\}>\s*<label>Documentation Services<\/label>[\s\S]*?<\/select>\s*<\/div>/, '');
fs.writeFileSync('src/app/customers/[id]/page.tsx', idPage);

console.log('Reverted customer forms');
