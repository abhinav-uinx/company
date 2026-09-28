const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const fetchCustomerReplacement = `async function fetchCustomer() {
      if (!id) return;
      const { data } = await supabaseAuth.from('customers').select('*').eq('id', id).single();
      const sRes = await supabaseAuth.from('services').select('*');
      
      if (sRes.data) setServices(sRes.data);
      setCustomer(data);
      
      const serviceObj = sRes.data?.find((s: any) => s.id === data.service);
      const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
      
      if (bucket && data.passport && Array.isArray(data.passport)) {
        const uploadsData = await Promise.all(data.passport.map(async (file: any) => {
          const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(file.path, 3600);
          return { name: file.name, type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signed?.signedUrl, path: file.path };
        }));
        setUploads(uploadsData);
      }
      setLoading(false);
    }`;

c = c.replace(/async function fetchCustomer\(\) \{[\s\S]*?setLoading\(false\);\n    \}/, fetchCustomerReplacement);


const removeUploadReplacement = `const removeUpload = async (index: number) => {
    const file = uploads[index];
    if (file && file.path) {
      const serviceObj = services.find((s: any) => s.id === customer.service);
      const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
      if (bucket) {
        await supabaseAuth.storage.from(bucket).remove([file.path]);
      }
    }
    setUploads(prev => prev.filter((_, i) => i !== index));
  };`;

c = c.replace(/const removeUpload = \(index: number\) => \{\n    setUploads\(prev => prev\.filter\(\(_, i\) => i !== index\)\);\n  \};/, removeUploadReplacement);

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed fetch and remove');
