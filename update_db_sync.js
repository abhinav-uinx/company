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

c = c.replace('delete (cleanData as any).passport_photo_url;', 'delete (cleanData as any).passport_photo_url;\n    cleanData.passport = uploads.map(u => ({ name: u.name, path: u.path }));');

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Update edit successful');
