const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

c = c.replace("if (!customer) return <div className={styles.container}>Customer not found.</div>;", 
"if (!customer) return <div className={styles.container}>Customer not found.</div>;\n\n  const selectedService = services.find(s => s.id === customer?.service_id);\n  const isGeneral = selectedService && selectedService.name === 'General Service';");

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
