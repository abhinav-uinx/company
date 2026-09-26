const fs = require('fs');

function cleanDirectoryPage() {
  let c = fs.readFileSync('src/app/admin/directory/page.tsx', 'utf8');

  // 1. Remove state variables
  const s1 = c.indexOf('// Add Employee Form State');
  const e1_str = "const [addMsg, setAddMsg] = useState({ type: '', text: '' });\r\n";
  const e1_idx = c.indexOf(e1_str);
  if (s1 !== -1 && e1_idx !== -1) {
    c = c.substring(0, s1) + c.substring(e1_idx + e1_str.length);
  } else {
    // try just \n instead of \r\n
    const e1_str2 = "const [addMsg, setAddMsg] = useState({ type: '', text: '' });\n";
    const e1_idx2 = c.indexOf(e1_str2);
    if (s1 !== -1 && e1_idx2 !== -1) {
      c = c.substring(0, s1) + c.substring(e1_idx2 + e1_str2.length);
    }
  }

  // 2. Remove handleAddEmployee
  const s2 = c.indexOf('const handleAddEmployee = async');
  if (s2 !== -1) {
    const e2 = c.indexOf('};', c.indexOf('loadUsers();', s2)) + 2;
    c = c.substring(0, s2) + c.substring(e2);
  }

  // 3. Remove Add Employee tab block
  const s3 = c.indexOf('<div className={`tab-content ${activeTab === \'add\' ? \'active\' : \'\'}`}>');
  if (s3 !== -1) {
    const endForm = c.indexOf('</form>', s3);
    const div1 = c.indexOf('</div>', endForm) + 6;
    const div2 = c.indexOf('</div>', div1) + 6;
    c = c.substring(0, s3) + c.substring(div2);
  }

  // 4. Update the Tab Button to a Link
  const s4 = c.indexOf('<button className={`tab-btn ${activeTab === \'add\' ? \'active\' : \'\'}`');
  if (s4 !== -1) {
    const endBtn = c.indexOf('</button>', s4) + 9;
    c = c.substring(0, s4) + '<Link href="/admin/directory/add-employee" className="tab-btn" style={{ textDecoration: "none" }}>Add Employee</Link>' + c.substring(endBtn);
  }

  fs.writeFileSync('src/app/admin/directory/page.tsx', c);
  console.log('Cleaned securely!');
}

cleanDirectoryPage();
