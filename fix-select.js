const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

c = c.replace(/<label>Service Type \*\s*<\/label>\s*<select value=\{formData\.service_type\}[\s\S]*?<\/select>/,
`<label>Service Types (Hold Ctrl/Cmd to select multiple) *</label>
                  <select multiple required value={formData.service_type_ids} onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setFormData({...formData, service_type_ids: selected});
                  }} style={{ height: '100px' }}>
                    {docServiceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>`);

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed for real');
