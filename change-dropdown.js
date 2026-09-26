const fs = require('fs');
let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

// Add customers state
cNew = cNew.replace(/const \[genServiceId, setGenServiceId\] = useState<string>\(''\);/,
  "const [genServiceId, setGenServiceId] = useState<string>('');\n  const [customers, setCustomers] = useState<any[]>([]);");

// Add customer_id to formData
cNew = cNew.replace(/name: '',/, "customer_id: '',\n    name: '',");

// Fetch customers
cNew = cNew.replace(/const \{ data: s \} = await supabaseAuth\.from\('services'\)\.select\('id'\)\.eq\('name', 'General Service'\)\.single\(\);/,
  `const { data: s } = await supabaseAuth.from('services').select('id').eq('name', 'General Service').single();
      if (s) {
        setGenServiceId(s.id);
        const { data: c } = await supabaseAuth.from('customers').select('id, name, contact_number, service_type').eq('service', s.id);
        if (c) setCustomers(c);
      }`);

// Change handleChange to auto-fill when customer is selected
cNew = cNew.replace(/const handleChange = \(e: any\) => \{/,
  `const handleChange = (e: any) => {
    if (e.target.name === 'customer_id') {
      const selectedCust = customers.find(c => c.id === e.target.value);
      if (selectedCust) {
        setFormData({ 
          ...formData, 
          customer_id: selectedCust.id,
          name: selectedCust.name,
          contact_number: selectedCust.contact_number || '',
          service_type: selectedCust.service_type || []
        });
      } else {
        setFormData({ ...formData, customer_id: '', name: '', contact_number: '', service_type: [] });
      }
      return;
    }`);

// Change submit from insert to update
cNew = cNew.replace(/const \{ error \} = await supabaseAuth\.from\('customers'\)\.insert\(\[payload\]\);/,
  `if (!formData.customer_id) { alert("Please select a customer"); setLoading(false); return; }
      const { error } = await supabaseAuth.from('customers').update(payload).eq('id', formData.customer_id);`);

// Change UI to dropdown
cNew = cNew.replace(/<input type="text" name="name" required value=\{formData\.name \|\| ''\} onChange=\{handleChange\} \/>/,
  `<select name="customer_id" required value={formData.customer_id} onChange={handleChange}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>`);

// Update page title
cNew = cNew.replace(/New General Service Customer/, "New Documentation Request");
cNew = cNew.replace(/Save Customer/, "Submit Request");

fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);
console.log('Changed to dropdown');
