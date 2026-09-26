const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

if (!c.includes('const [services, setServices] = useState')) {
  c = c.replace(/const \[loading, setLoading\] = useState\(true\);/, 'const [loading, setLoading] = useState(true);\n  const [services, setServices] = useState<any[]>([]);');
}

c = c.replace(/async function fetchCustomer\(\) \{([\s\S]*?)\}/, 'async function fetchCustomer() {$1\n    const sRes = await supabaseAuth.from("services").select("*");\n    if (sRes.data) setServices(sRes.data);\n  }');

c = c.replace(/<div className=\{styles\.formSection\}>Passport & Visa Details<\/div>/, 
`          <div className={styles.formSection}>Service Type</div>
          <div className={styles.formGroup}>
            <label>Select Service *</label>
            <select name="service_id" required value={formData.service_id || ''} onChange={handleChange}>
              <option value="">-- Select Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={styles.formSection}>Passport & Visa Details</div>`
);

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed edit form');
