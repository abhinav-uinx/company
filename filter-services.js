const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/if \(sRes\.data\) \{\n\s*setServices\(sRes\.data\);/,
`if (sRes.data) {
        // Filter out any documentation services belonging to non-General Service customers
        const validCustomerIds = pRes.data ? pRes.data.map(c => c.id) : [];
        const filteredDocs = sRes.data.filter(s => validCustomerIds.includes(s.customer_id));
        setServices(filteredDocs);`);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Filtered services');
