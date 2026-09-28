const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

c = c.replace(/if \(data\.passport_photo_url\) \{[\s\S]*?\}\n      \}\n/, 
`const serviceObj = sRes.data?.find((s: any) => s.id === data.service);
      const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
      
      if (bucket) {
        const { data: files } = await supabaseAuth.storage.from(bucket).list(id + '/passport');
        if (files) {
          const realFiles = files.filter((f: any) => f.name !== '.keep' && !f.name.startsWith('.empty'));
          const uploadsData = await Promise.all(realFiles.map(async (f: any) => {
            const path = id + '/passport/' + f.name;
            const { data: signed } = await supabaseAuth.storage.from(bucket).createSignedUrl(path, 3600);
            return { name: f.name, type: f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', data: signed?.signedUrl, path };
          }));
          setUploads(uploadsData);
        }
      }\n`);

c = c.replace(/const handleFileUpload = \(e: any\) => \{[\s\S]*?\}\);\n  \};/,
`const [uploading, setUploading] = useState(false);

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
        alert('Upload failed: ' + error.message);
      }
    }
    setUploading(false);
  };`);

c = c.replace(/const removeUpload = \(index: number\) => \{[\s\S]*?\}\);\n  \};/,
`const removeUpload = async (index: number) => {
    const fileToRemove = uploads[index];
    if (fileToRemove.path) {
      const serviceObj = services.find(s => s.id === customer.service);
      const bucket = serviceObj?.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
      await supabaseAuth.storage.from(bucket).remove([fileToRemove.path]);
    }
    setUploads(prev => prev.filter((_, i) => i !== index));
  };`);

c = c.replace('const cleanData = { ...customer, passport_photo_url: JSON.stringify(uploads) };',
  'const cleanData = { ...customer };\n    delete (cleanData as any).passport_photo_url;');

c = c.replace(/>\s*Select Files\s*<\/label>/, '>{uploading ? "Uploading..." : "Select Files"}</label>');

c = c.replace('disabled={uploads.length >= 2}', 'disabled={uploads.length >= 2 || uploading}');

fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Update complete');
