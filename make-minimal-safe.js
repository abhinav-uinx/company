const fs = require('fs');

let cNew = fs.readFileSync('src/app/documentation/new/page.tsx', 'utf8');

const minimalForm = `
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
          
          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <input type="text" name="name" required value={formData.name || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={formData.contact_number || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
            <select multiple name="service_type" value={formData.service_type || []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setFormData({...formData, service_type: selected});
            }} style={{ height: '160px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id} style={{ padding: '8px' }}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: '20px' }}>
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </form>
`;

cNew = cNew.replace(/<form onSubmit=\{handleSubmit\} className=\{styles\.formGrid\}>[\s\S]*?<\/form>/, minimalForm);
fs.writeFileSync('src/app/documentation/new/page.tsx', cNew);

let cId = fs.readFileSync('src/app/documentation/[id]/page.tsx', 'utf8');

const minimalEdit = `
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
          
          <div className={styles.formGroup}>
            <label>Customer Name *</label>
            <input type="text" name="name" required value={customer.name || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={customer.contact_number || ''} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Documentation Services (Hold Ctrl/Cmd for multiple)</label>
            <select multiple name="service_type" value={customer.service_type || []} onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setCustomer({...customer, service_type: selected});
            }} style={{ height: '160px' }}>
              {docServices.map(s => (
                <option key={s.id} value={s.id} style={{ padding: '8px' }}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className={styles.submitBtn} style={{ marginTop: '20px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
`;

cId = cId.replace(/<form onSubmit=\{handleSubmit\} className=\{styles\.formGrid\}>[\s\S]*?<\/form>/, minimalEdit);
fs.writeFileSync('src/app/documentation/[id]/page.tsx', cId);

console.log('Made minimal');
