const fs = require('fs');
let c = fs.readFileSync('src/app/admin/directory/page.tsx', 'utf8');

// 1. Remove the Add Employee State
c = c.replace(/\s*\/\/ Add Employee Form State[\s\S]*?const \[addMsg, setAddMsg\] = useState\(\{ type: '', text: '' \}\);/m, '');

// 2. Remove handleAddEmployee function
c = c.replace(/\s*const handleAddEmployee = async \(e: React\.FormEvent\) => \{[\s\S]*?loadUsers\(\);\n\s*\}\n\s*\};/m, '');

// 3. Remove the tab content block (which ends with `)}` matching the `activeTab === 'add' && (`
// Instead of complex regex, I'll find it with string methods
const addTabIdx = c.indexOf("{activeTab === 'add' && (");
if (addTabIdx !== -1) {
  // find the closing `)}`
  const remainder = c.substring(addTabIdx);
  const endIdx = remainder.indexOf(')}');
  if (endIdx !== -1) {
    const block = remainder.substring(0, endIdx + 2);
    c = c.replace(block, '');
  }
}

// 4. Change the Add Employee tab button to a Link
c = c.replace(
  /<button className=\{`tab-btn \$\{activeTab === 'add' \? 'active' : ''\}`\} onClick=\{.*?\}>Add Employee<\/button>/,
  '<Link href="/admin/directory/add-employee" className="tab-btn" style={{ textDecoration: "none" }}>Add Employee</Link>'
);

fs.writeFileSync('src/app/admin/directory/page.tsx', c);
console.log('Removed Add Employee logic from directory/page.tsx');
