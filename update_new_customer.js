const fs = require('fs');
let c = fs.readFileSync('src/app/customers/new/page.tsx', 'utf8');

const stateInjection = `
  const [uploads, setUploads] = useState<File[]>([]);

  const handleFileUpload = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (uploads.length + files.length > 2) {
      return alert('Maximum 2 uploads allowed for Passport.');
    }
    setUploads(prev => [...prev, ...files]);
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };
`;

c = c.replace(/const \[services, setServices\] = useState<any\[\]>\(\[\]\);/, 'const [services, setServices] = useState<any[]>([]);\n' + stateInjection);

const handleSubmitReplacement = `
      if (error) {
        setMsg({ text: 'Error adding customer: ' + error.message, type: 'error' });
      } else {
        const serviceObj = services.find(s => s.id === formData.service);
        if (serviceObj && newCustomer) {
          const bucket = serviceObj.name === 'Medical Escort' ? 'medical_escort' : 'general_service';
          
          let passportJson: any[] = [];
          if (uploads.length > 0) {
            for (const file of uploads) {
              const filePath = newCustomer.id + '/passport/' + file.name;
              const { error: upErr } = await supabaseAuth.storage.from(bucket).upload(filePath, file);
              if (!upErr) {
                passportJson.push({ name: file.name, path: filePath });
              }
            }
          }
          
          if (passportJson.length > 0) {
             await supabaseAuth.from('customers').update({ passport: passportJson }).eq('id', newCustomer.id);
          } else {
            const emptyBlob = new Blob([' '], { type: 'text/plain' });
            await supabaseAuth.storage.from(bucket).upload(newCustomer.id + '/passport/.keep', emptyBlob);
          }
          
          const emptyBlob2 = new Blob([' '], { type: 'text/plain' });
          await supabaseAuth.storage.from(bucket).upload(newCustomer.id + '/ticket/.keep', emptyBlob2);
        }

        setMsg({ text: 'Customer added successfully! Redirecting...', type: 'success' });
        setTimeout(() => {
          router.push('/customers');
        }, 1500);
      }
`;

c = c.replace(/if \(error\) \{[\s\S]*?\}, 1500\);\n      \}/, handleSubmitReplacement.trim());

const uiInjection = `
            <div className={styles.formSection}>Passport Documents Upload</div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Upload Passport Files (Front/Back or Single PDF - Max 2)</label>
              <div style={{ border: '1px dashed #cbd5e1', padding: '30px', borderRadius: '8px', textAlign: 'center', background: '#f8fafc' }}>
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploads.length >= 2 || loading} style={{ display: 'none' }} id="passport-upload-new" />
                <label htmlFor="passport-upload-new" style={{ display: 'inline-block', padding: '10px 20px', background: uploads.length >= 2 ? '#cbd5e1' : '#0f172a', color: 'white', borderRadius: '6px', cursor: uploads.length >= 2 ? 'not-allowed' : 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>upload_file</span>Select Files
                </label>
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#64748b' }}>{uploads.length}/2 Files Selected</p>
              </div>

              {uploads.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  {uploads.map((file, i) => (
                    <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', position: 'relative', background: '#fff' }}>
                      <button type="button" onClick={() => removeUpload(i)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>&times;</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: file.type.includes('pdf') ? '#ef4444' : '#2563eb', fontSize: '32px' }}>
                          {file.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.formSection}>Medical & Emergency</div>
`;

c = c.replace(/<div className=\{styles\.formSection\}>Medical & Emergency<\/div>/, uiInjection.trim());

fs.writeFileSync('src/app/customers/new/page.tsx', c);
console.log('Update new page successful');
