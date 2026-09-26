const fs = require('fs');

// ── 1. Dashboard: remove medifCount state + medif_records query + Medical Escort service card ──
let dash = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Remove state
dash = dash.replace(/\r?\n\s*const \[medifCount, setMedifCount\] = useState\(0\);/, '');

// Remove medif_records supabase call
dash = dash.replace(/\r?\n\s*supabaseAuth\.from\('medif_records'\)[\s\S]*?setMedifCount\(count \|\| 0\);\r?\n\s*\}\);/, '');

// Remove Medical Escort service card block
dash = dash.replace(/\r?\n\s*<div className="service-card" onClick=\{\(\) => router\.push\('\/medif\/new'\)\}[\s\S]*?<\/div>\s*\n/,'');

// Remove {medifCount} doc reference from vault card
dash = dash.replace(/\r?\n\s*<span className="doc-count">\{medifCount\} documents stored<\/span>/,'');

fs.writeFileSync('src/app/dashboard/page.tsx', dash);
console.log('✓ Dashboard cleaned');

// ── 2. Remove service_type from customers/new/page.tsx ──
let cNew = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');
// Remove docServices state
cNew = cNew.replace(/\r?\n\s*const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);/, '');
// Remove service_type from formData
cNew = cNew.replace(/\r?\n\s*service_type: \[\] as string\[\],/, '');
// Remove doc_service_types fetch
cNew = cNew.replace(/\r?\n\s*const dRes = await supabaseAuth\.from\('doc_service_types'\)[\s\S]*?if \(dRes\.data\) setDocServices\(dRes\.data\);/, '');
// Remove isGeneral + doc multi-select UI
cNew = cNew.replace(/\r?\n\s*\{isGeneral && \([\s\S]*?\)\)[\s\S]*?\}\}[\s\S]*?<\/div>\r?\n\s*\}\}/m,'');
// Remove service_type multi-select UI block broadly
cNew = cNew.replace(/\r?\n\s*\{isGeneral &&[\s\S]*?<\/select>[\s\S]*?<\/div>\r?\n\s*\}\}/,'');
fs.writeFileSync('src/app/customers/new/page.tsx', cNew);
console.log('✓ customers/new cleaned');

// ── 3. Remove service_type from customers/[id]/page.tsx ──
let cId = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');
cId = cId.replace(/\r?\n\s*const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);/, '');
cId = cId.replace(/\r?\n\s*const dRes = await supabaseAuth\.from\('doc_service_types'\)[\s\S]*?if \(dRes\.data\) setDocServices\(dRes\.data\);/, '');
cId = cId.replace(/\r?\n\s*\{isGeneral &&[\s\S]*?<\/select>[\s\S]*?<\/div>\r?\n\s*\}\}/,'');
fs.writeFileSync('src/app/customers/[id]/page.tsx', cId);
console.log('✓ customers/[id] cleaned');

// ── 4. Remove service_type from customers/page.tsx ──
let cPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');
cPage = cPage.replace(/\r?\n\s*const \[docServices, setDocServices\] = useState<any\[\]>\(\[\]\);/, '');
cPage = cPage.replace(/,\r?\n\s*supabaseAuth\.from\('doc_service_types'\)[\s\S]*?if \(dRes\.data\) setDocServices\(dRes\.data\);/, '');
// Remove Documentation Services column header
cPage = cPage.replace(/\r?\n\s*<th>Documentation Services<\/th>/, '');
// Remove doc services td cell
cPage = cPage.replace(/\r?\n\s*<td>\r?\n\s*\{customer\.service_type[\s\S]*?<\/td>/,'');
fs.writeFileSync('src/app/customers/page.tsx', cPage);
console.log('✓ customers/page cleaned');

// ── 5. documentation pages - replace service_type with general_service_records lookup ──
// documentation/page.tsx - replace service_type reference in table
let docPage = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');
// Replace "customers who have service_type" filter with all general service customers
docPage = docPage.replace(
  /supabaseAuth\.from\('customers'\)\.select\('id, name, service_type'\)\.eq\('service', genService\.id\)/,
  "supabaseAuth.from('customers').select('id, name').eq('service', genService.id)"
);
// Replace pill display of service_type with a link to their records
docPage = docPage.replace(
  /<td>\s*\r?\n\s*<div style=\{ display: 'flex', flexWrap: 'wrap', gap: '6px' \}>\s*\r?\n\s*\{c\.service_type[\s\S]*?<\/td>/,
  `<td><span style={{ color: '#64748b', fontSize: '0.8rem' }}>View records</span></td>`
);
// Remove "only show customers with service_type" filter
docPage = docPage.replace(
  /\r?\n\s*const activeDocs = cRes\.data\.filter\([^)]+\);\r?\n\s*setCustomers\(activeDocs\);/,
  '\n      if (cRes.data) setCustomers(cRes.data);'
);
fs.writeFileSync('src/app/documentation/page.tsx', docPage);
console.log('✓ documentation/page cleaned');

console.log('\nAll frontend files cleaned. Now run the SQL in Supabase.');
