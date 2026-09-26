const fs = require('fs');

let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

const stateRegex = /const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/;
const cleanState = `const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    contact_number: '',
    service_type: [] as string[]
  });`;

cNew = cNew.replace(stateRegex, cleanState);
fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);
console.log('Fixed formData state');
