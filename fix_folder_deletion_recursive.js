const fs = require('fs');
let c = fs.readFileSync('src/app/customers/page.tsx', 'utf8');

const replacement = `if (bucket) {
           const deleteRecursively = async (path: string) => {
             const { data: list } = await supabaseAuth.storage.from(bucket).list(path);
             if (!list || list.length === 0) return;
             
             for (const item of list) {
               if (item.id === null) {
                 await deleteRecursively(path + '/' + item.name);
               } else {
                 await supabaseAuth.storage.from(bucket).remove([path + '/' + item.name]);
               }
             }
           };
           await deleteRecursively(id);
        }`;

c = c.replace(/if \(bucket\) \{[\s\S]*?\}\n        \}/, replacement);
fs.writeFileSync('src/app/customers/page.tsx', c);
console.log('Fixed folder deletion recursive');
