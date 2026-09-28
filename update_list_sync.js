const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

const handlersReplace = `
  const [viewPassports, setViewPassports] = useState<any[]>([]);
  const [loadingPassports, setLoadingPassports] = useState(false);

  const handleViewCustomer = async (customer: any) => {
    setViewCustomer(customer);
    setLoadingPassports(true);
    setViewPassports([]);
    
    const serviceObj = services.find(s => s.id === customer.service);
    const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
    
    if (bucket && customer.passport && Array.isArray(customer.passport)) {
      const uploadsData = await Promise.all(customer.passport.map(async (file: any) => {
        const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(file.path, 3600);
        return { name: file.name, type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signed?.signedUrl, path: file.path };
      }));
      setViewPassports(uploadsData);
    }
    setLoadingPassports(false);
  };
`;

c = c.replace(/const \[viewPassports[\s\S]*?setLoadingPassports\(false\);\n  \};/g, handlersReplace.trim());

fs.writeFileSync('src/app/customers/page.tsx', c);
console.log('Update list successful');
