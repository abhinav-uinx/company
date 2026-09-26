'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../customers.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [uploads, setUploads] = useState<any[]>([]);
  const [fullscreenFile, setFullscreenFile] = useState<any>(null);

  useEffect(() => {
    async function fetchCustomer() {
      if (!id) return;
      const { data } = await supabaseAuth.from('customers').select('*').eq('id', id).single();
      setCustomer(data);
      if (data.passport_photo_url) {
        try {
          const parsed = JSON.parse(data.passport_photo_url);
          if (Array.isArray(parsed)) setUploads(parsed);
        } catch(e) {
          console.error('Not JSON', e);
        }
      }
      setLoading(false);
    }
    fetchCustomer();
  }, [id]);

  
  const handleFileUpload = (e: any) => {
    const files = Array.from(e.target.files);
    if (uploads.length + files.length > 2) {
      return alert('Maximum 2 uploads allowed for Passport.');
    }
    
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploads(prev => [...prev, { name: file.name, type: file.type, data: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  
  const handleShare = async (file: any) => {
    try {
      const res = await fetch(file.data);
      const blob = await res.blob();
      const fileObj = new File([blob], file.name, { type: file.type });

      if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: file.name,
          text: 'Customer Passport Document'
        });
      } else {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
      }
    } catch (err) {
      console.error(err);
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      link.click();
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleChange = (e: any) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });
    
    const cleanData = { ...customer, passport_photo_url: JSON.stringify(uploads) };
    if (!cleanData.dob) delete (cleanData as any).dob;
    if (!cleanData.passport_expiry) delete (cleanData as any).passport_expiry;
    if (!cleanData.visa_expiry) delete (cleanData as any).visa_expiry;

    const { error } = await supabaseAuth.from('customers').update(cleanData).eq('id', id);

    if (error) {
      setMsg({ text: 'Error updating: ' + error.message, type: 'error' });
    } else {
      setMsg({ text: 'Customer updated successfully!', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.container}><LoadingIcon /></div>;
  if (!customer) return <div className={styles.container}>Customer not found.</div>;

  return (
    <div className={styles.container}>
      <Link href="/customers" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Customers
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Customer: {customer.name}</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleUpdate} className={styles.formGrid}>
          
          <div className={styles.formSection}>Basic Information</div>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input type="text" name="name" required value={customer.name || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Nationality</label>
            <input type="text" name="nationality" value={customer.nationality || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Date of Birth</label>
            <input type="date" name="dob" value={customer.dob || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Contact Number</label>
            <input type="text" name="contact_number" value={customer.contact_number || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input type="email" name="email" value={customer.email || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Physical Address</label>
            <textarea name="address" rows={2} value={customer.address || ''} onChange={handleChange}></textarea>
          </div>

          <div className={styles.formSection}>Passport & Visa Details</div>
          <div className={styles.formGroup}>
            <label>Passport Number</label>
            <input type="text" name="passport_no" value={customer.passport_no || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Passport Expiry</label>
            <input type="date" name="passport_expiry" value={customer.passport_expiry || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Number</label>
            <input type="text" name="visa_no" value={customer.visa_no || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Type</label>
            <input type="text" name="visa_type" value={customer.visa_type || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Country</label>
            <input type="text" name="visa_country" value={customer.visa_country || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Visa Expiry</label>
            <input type="date" name="visa_expiry" value={customer.visa_expiry || ''} onChange={handleChange} />
          </div>

          
          <div className={styles.formSection}>Passport Documents Upload</div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Upload Passport Files (Front/Back or Single PDF - Max 2)</label>
            <div style={{ padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', background: '#f8fafc', marginBottom: '15px' }}>
              <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploads.length >= 2} style={{ display: 'none' }} id="passport-upload" />
              <label htmlFor="passport-upload" style={{ display: 'inline-block', padding: '10px 20px', background: uploads.length >= 2 ? '#cbd5e1' : '#0f172a', color: 'white', borderRadius: '6px', cursor: uploads.length >= 2 ? 'not-allowed' : 'pointer' }}>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>upload_file</span>
                Select Files
              </label>
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#64748b' }}>{uploads.length}/2 Files Uploaded</p>
            </div>

            {uploads.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {uploads.map((file, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', position: 'relative', background: '#fff' }}>
                    <button type="button" onClick={() => removeUpload(i)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>&times;</button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: file.type.includes('pdf') ? '#ef4444' : '#2563eb', fontSize: '32px' }}>
                        {file.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{file.type}</div>
                      </div>
                    </div>
                    
                    {file.type.includes('image') ? (
                      <>
                        <img src={file.data} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setFullscreenFile(file)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="button" onClick={() => setFullscreenFile(file)} style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span> View</button>
                          <button type="button" onClick={() => handleShare(file)} style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 500 }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span> Share</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '200px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                        <iframe src={file.data} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
  
          <div className={styles.formSection}>Medical & Emergency</div>
          <div className={styles.formGroup}>
            <label>Emergency Contact Name</label>
            <input type="text" name="emergency_contact_name" value={customer.emergency_contact_name || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Emergency Contact Phone</label>
            <input type="text" name="emergency_contact_phone" value={customer.emergency_contact_phone || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Current Hospital</label>
            <input type="text" name="current_hospital" value={customer.current_hospital || ''} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Medical Condition</label>
            <textarea name="medical_condition" rows={2} value={customer.medical_condition || ''} onChange={handleChange}></textarea>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            {msg.text && <div style={{ padding: '10px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '15px' }}>{msg.text}</div>}
            <button type="submit" className={styles.submitBtn} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {fullscreenFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0 }}>
            <h3 style={{ color: 'white', margin: 0 }}>{fullscreenFile.name}</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" onClick={() => handleShare(fullscreenFile)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <span className="material-symbols-outlined">share</span> Share / Download
              </button>
              <button type="button" onClick={() => setFullscreenFile(null)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
          </div>
          
          <div style={{ width: '90%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '40px' }}>
            {fullscreenFile.type.includes('image') ? (
              <img src={fullscreenFile.data} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Fullscreen Preview" />
            ) : (
              <iframe src={fullscreenFile.data} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '8px' }} title="Fullscreen PDF" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
