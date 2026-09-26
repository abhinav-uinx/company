const fs = require('fs');

let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

const minimalForm = `
        <form onSubmit={handleSubmit} className={styles.formGrid} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
          
          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
            <select multiple name="service_type" value={formData.service_type} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFormData({...formData, service_type: selected});
            }} style={{ height: '150px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: '10px' }}>
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
`;

cNew = cNew.replace(/<form onSubmit=\{handleSubmit\} className=\{styles\.formGrid\}>[\s\S]*?<\/form>/, minimalForm);
fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);

let cId = fs.readFileSync('src/app/documentation/[id]/page.tsx', 'utf8');
const minimalEdit = minimalForm.replace(/formData/g, 'customer').replace('setFormData({...formData', 'setCustomer({...customer').replace('Save Customer', 'Save Changes').replace(/disabled=\{loading\}/, 'disabled={saving}').replace(/loading \? 'Saving\.\.\.' :/, 'saving ? \\'Saving...\\' :');

cId = cId.replace(/<form onSubmit=\{handleSubmit\} className=\{styles\.formGrid\}>[\s\S]*?<\/form>/, minimalEdit);
fs.writeFileSync('src/app/documentation/[id]/page.tsx', cId);

console.log('Made forms minimal');
