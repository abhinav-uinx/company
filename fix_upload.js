const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const target = `  const handleFileUpload = (e: any) => {
      const files = Array.from(e.target.files);
      if (uploads.length + files.length > 2) {
        return alert('Maximum 2 uploads allowed for Passport.');
      }
      
      files.forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploads(prev => [...prev, { name: file.name, type: file.type, data: reader.result }]);
        };
        reader.readAsDataURL(file);
      });
    };`;

const replacement = `  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (uploads.length + files.length > 2) {
      return alert('Maximum 2 uploads allowed for Passport.');
    }
    
    setUploading(true);
    const serviceObj = services.find(s => s.id === customer.service);
    const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
    
    for (const file of files) {
      const filePath = id + '/passport/' + file.name;
      const { error } = await supabaseAuth.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (!error) {
        const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(filePath, 3600);
        setUploads(prev => [...prev, { name: file.name, type: file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signed?.signedUrl, path: filePath }]);
      } else {
        alert('Error uploading: ' + error.message);
      }
    }
    setUploading(false);
  };`;

c = c.replace(target, replacement);
fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
