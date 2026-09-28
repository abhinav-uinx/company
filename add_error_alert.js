const fs = require('fs');
let c = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');

const regex = /const \{ error: upErr \} = await supabaseAuth\.storage\.from\(bucket\)\.upload\(filePath, file\);\s*if \(\!upErr\) \{\s*passportJson\.push\(\{ name: file\.name, path: filePath \}\);\s*\}/;

const replacement = `const { error: upErr } = await supabaseAuth.storage.from(bucket).upload(filePath, file);
              if (!upErr) {
                passportJson.push({ name: file.name, path: filePath });
              } else {
                alert('Upload Error: ' + upErr.message);
                console.error('Upload Error:', upErr);
              }`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/app/customers/new/page.tsx', c);
console.log('Added error alert');
