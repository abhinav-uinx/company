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
    
    if (bucket) {
      const { data: files } = await supabaseAuth.storage.from(bucket).list(customer.id + '/passport');
      if (files) {
        const realFiles = files.filter((f: any) => f.name !== '.keep' && !f.name.startsWith('.empty'));
        const uploadsData = await Promise.all(realFiles.map(async (f: any) => {
          const path = customer.id + '/passport/' + f.name;
          const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(path, 3600);
          return { name: f.name, type: 'url', data: signed?.signedUrl, path };
        }));
        setViewPassports(uploadsData);
      }
    }
    setLoadingPassports(false);
  };

  const getPassports = (customer: any) => {
    return viewPassports;
  };
`;

c = c.replace(/const getPassports = \(customer: any\) => \{[\s\S]*?\}\;/g, handlersReplace.trim());
c = c.replace(/onClick=\{\(\) => setViewCustomer\(customer\)\}/g, 'onClick={() => handleViewCustomer(customer)}');

// Fix rendering of passports in the quick view modal
const renderReplace = `
            {loadingPassports ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Loading passports...</div>
            ) : viewPassports.length > 0 ? (
`;

c = c.replace(/\{getPassports\(viewCustomer\)\.length > 0 \? \(/g, renderReplace.trim());

fs.writeFileSync('src/app/customers/page.tsx', c);
console.log('Update list successful');
