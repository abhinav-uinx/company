const fs = require('fs');

// 1. Update new/page.tsx
let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

const newCheckboxes = `
          <div className={styles.formGroup}>
            <label style={{ marginBottom: '10px', display: 'block' }}>Documentation Services *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {docServices.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 400, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.service_ids.includes(s.id)}
                    onChange={() => {
                      const ids = formData.service_ids;
                      const newIds = ids.includes(s.id) ? ids.filter(i => i !== s.id) : [...ids, s.id];
                      setFormData({ ...formData, service_ids: newIds });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {formData.service_ids.length === 0 && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>Please select at least one service.</span>}
          </div>`;

cNew = cNew.replace(
  /<div className=\{styles\.formGroup\}>\s*<label>Documentation Services \* \(Hold Ctrl\/Cmd for multiple\)<\/label>[\s\S]*?<\/select>\s*<\/div>/,
  newCheckboxes
);

fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);


// 2. Update [id]/page.tsx
let cEdit = fs.readFileSync('src/app/documentation/[id]/page.tsx', 'utf8');

const editCheckboxes = `
          <div className={styles.formGroup}>
            <label style={{ marginBottom: '10px', display: 'block' }}>Documentation Services *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {docServices.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 400, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={(record.service_ids || []).includes(s.id)}
                    onChange={() => {
                      const ids = record.service_ids || [];
                      const newIds = ids.includes(s.id) ? ids.filter(i => i !== s.id) : [...ids, s.id];
                      setRecord({ ...record, service_ids: newIds });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>`;

cEdit = cEdit.replace(
  /<div className=\{styles\.formGroup\}>\s*<label>Documentation Services \(Hold Ctrl\/Cmd for multiple\)<\/label>[\s\S]*?<\/select>\s*<\/div>/,
  editCheckboxes
);

fs.writeFileSync('src/app/documentation/[id]/page.tsx', cEdit);

console.log('Fixed checkboxes in both pages');
