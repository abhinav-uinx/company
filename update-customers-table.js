const fs = require('fs');

let cPage = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

// Add docService state
cPage = cPage.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/,
  "const [services, setServices] = useState<any[]>([]);\n  const [docServices, setDocServices] = useState<any[]>([]);");

// Update fetch
cPage = cPage.replace(/const \[cRes, sRes\] = await Promise\.all\(\[/,
  "const [cRes, sRes, dRes] = await Promise.all([");

cPage = cPage.replace(/supabaseAuth\.from\('services'\)\.select\('\*'\)/,
  "supabaseAuth.from('services').select('*'),\n      supabaseAuth.from('doc_service_types').select('*')");

cPage = cPage.replace(/if \(sRes\.data\) setServices\(sRes\.data\);/,
  "if (sRes.data) setServices(sRes.data);\n    if (dRes.data) setDocServices(dRes.data);");

// Add table header
cPage = cPage.replace(/<th>Services<\/th>/,
  "<th>Main Services</th>\n                <th>Documentation Services</th>");

// Add table cell
cPage = cPage.replace(/<td>\{customer\.service_ids[\s\S]*?<\/td>/,
  `$&
                  <td>
                    {customer.doc_service_ids && customer.doc_service_ids.length > 0 
                      ? customer.doc_service_ids.map((id: string) => docServices.find(d => d.id === id)?.name).filter(Boolean).join(', ') 
                      : 'None'}
                  </td>`);

fs.writeFileSync('src/app/customers/page.tsx', cPage);
console.log('Fixed customers table');
