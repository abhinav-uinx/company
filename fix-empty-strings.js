const fs = require('fs');

let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

const replacement = `const payload = { ...formData, service: genServiceId };
      delete (payload as any).customer_id;
      // Clean up empty strings for database
      Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === '') {
          delete (payload as any)[key];
        }
      });`;

cNew = cNew.replace(/const payload = \{[\s\S]*?delete \(payload as any\)\.customer_id;/, replacement);

fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);

let cId = fs.readFileSync('src/app/documentation/[id]/page.tsx', 'utf8');
const idReplacement = `const payload = { ...customer };
      // clean up fields not in DB if any
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });`;
cId = cId.replace(/const payload = \{ \.\.\.customer \};\n\s*\/\/ clean up fields not in DB if any/, idReplacement);
fs.writeFileSync('src/app/documentation/[id]/page.tsx', cId);

console.log('Fixed empty strings');
