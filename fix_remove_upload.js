const fs = require('fs');
let c = fs.readFileSync('src/app/customers/[id]/page.tsx', 'utf8');

const startStr = '  const removeUpload = (index: number) => {';
const endStr = '  };';

const startIdx = c.indexOf(startStr);
const endIdx = c.indexOf(endStr, startIdx) + endStr.length;

const replacement = `  const removeUpload = async (index: number) => {
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

c = c.substring(0, startIdx) + replacement + c.substring(endIdx);
fs.writeFileSync('src/app/customers/[id]/page.tsx', c);
console.log('Fixed removeUpload!');
