const fs = require('fs');

function updateForm(file) {
  let c = fs.readFileSync(file, 'utf8');

  if (!c.includes('{!isGeneral && (')) {
    c = c.replace(/<div className=\{styles\.formSection\}>Medical & Emergency<\/div>/, '{!isGeneral && (\n            <>\n          <div className={styles.formSection}>Medical & Emergency</div>');
    c = c.replace(/<div className=\{styles\.formSection\}>Passport Photos \/ Documents<\/div>/, '          </>\n          )}\n          <div className={styles.formSection}>Passport Photos / Documents</div>');
  }

  fs.writeFileSync(file, c);
}

updateForm('src/app/customers/new/page.tsx');
updateForm('src/app/customers/[id]/page.tsx');
console.log('Fixed forms section');
