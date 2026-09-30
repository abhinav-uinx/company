'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import styles from '../escorts.module.css';
import LoadingIcon from '@/components/LoadingIcon';

export default function EditEscortMission() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [hasLayover, setHasLayover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [medifFile, setMedifFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [passportPreviews, setPassportPreviews] = useState<any[]>([]);
  const [medifPreviews, setMedifPreviews] = useState<any[]>([]);
  const [reasonsList, setReasonsList] = useState<string[]>([]);
  const [reasonInput, setReasonInput] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    from_country: '',
    to_country: '',
    layover_country: '',
    boarding_details: '',
    destination_address: '',
    escort_required_date: '',
    flight_no: '',
    pnr: '',
    flight_date: '',
    airline: '',
    ticket_cost: 0,
    escort_employee_iqama: '',
    approx_cost: 0,
    status: 'Pending'
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pRes, eRes, mRes] = await Promise.all([
        supabaseAuth.from('customers').select('id, name, passport, services!inner(name)').eq('services.name', 'Medical Escort'),
        supabaseAuth.from('employees').select('iqama_number, name').eq('status', 'active'),
        supabaseAuth.from('escort_missions').select('*').eq('id', id).single()
      ]);
      
      if (pRes.data) setCustomers(pRes.data);
      if (eRes.data) setEmployees(eRes.data);
      if (mRes.data) {
        setFormData({
          customer_id: mRes.data.customer_id || '',
          from_country: mRes.data.from_country || '',
          to_country: mRes.data.to_country || '',
          layover_country: mRes.data.layover_country || '',
          boarding_details: mRes.data.boarding_details || '',
          destination_address: mRes.data.destination_address || '',
          escort_required_date: mRes.data.escort_required_date || '',
          flight_no: mRes.data.flight_no || '',
          pnr: mRes.data.pnr || '',
          flight_date: mRes.data.flight_date || '',
          airline: mRes.data.airline || '',
          ticket_cost: mRes.data.ticket_cost || 0,
          escort_employee_iqama: mRes.data.escort_employee_iqama || '',
          approx_cost: mRes.data.approx_cost || 0,
          status: mRes.data.status || 'Pending'
        });
        if (mRes.data.reasons) {
          try {
            const parsed = JSON.parse(mRes.data.reasons);
            if (Array.isArray(parsed)) setReasonsList(parsed);
            else setReasonsList([mRes.data.reasons]);
          } catch(e) {
            setReasonsList([mRes.data.reasons]);
          }
        }
      }
      setLoading(false);
    }
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    async function loadPreviews() {
      if (!formData.customer_id) {
        setPassportPreviews([]);
        setMedifPreviews([]);
        return;
      }
      const cust = customers.find(c => c.id === formData.customer_id);
      if (cust && cust.passport && Array.isArray(cust.passport) && cust.passport.length > 0) {
        const previews = await Promise.all(cust.passport.map(async (file: any) => {
          const { data: signed } = await supabaseAuth.storage.from('medical_escort').createSignedUrl(file.path, 3600);
          return { ...file, url: signed?.signedUrl };
        }));
        setPassportPreviews(previews);
      } else {
        setPassportPreviews([]);
      }

      const { data: mList } = await supabaseAuth.storage.from('medical_escort').list(`${formData.customer_id}/medif form`);
      if (mList && mList.length > 0) {
        const mPreviews = await Promise.all(mList.filter((f: any) => f.name !== '.emptyFolderPlaceholder').map(async (f: any) => {
          const path = `${formData.customer_id}/medif form/${f.name}`;
          const { data: signed } = await supabaseAuth.storage.from('medical_escort').createSignedUrl(path, 3600);
          return { name: f.name, path, url: signed?.signedUrl };
        }));
        setMedifPreviews(mPreviews);
      } else {
        setMedifPreviews([]);
      }
    }
    loadPreviews();
  }, [formData.customer_id, customers]);

  const removeMedifFile = async (path: string) => {
    if (!confirm('Are you sure you want to delete this MEDIF form?')) return;
    await supabaseAuth.storage.from('medical_escort').remove([path]);
    setMedifPreviews(prev => prev.filter(p => p.path !== path));
  };

  const removePassportPage = async (path: string) => {
    if (!confirm('Are you sure you want to delete this passport page?')) return;
    
    await supabaseAuth.storage.from('medical_escort').remove([path]);
    
    const cust = customers.find(c => c.id === formData.customer_id);
    if (cust && cust.passport) {
      const newPassport = cust.passport.filter((p: any) => p.path !== path);
      await supabaseAuth.from('customers').update({ passport: newPassport }).eq('id', formData.customer_id);
      setCustomers(customers.map(c => c.id === formData.customer_id ? { ...c, passport: newPassport } : c));
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    const cleanData = { ...formData };
    if (!hasLayover) delete (cleanData as any).layover_country;
    if (!cleanData.escort_required_date) delete (cleanData as any).escort_required_date;
    if (!cleanData.flight_date) delete (cleanData as any).flight_date;
    
    let finalReasons = [...reasonsList];
    if (reasonInput.trim()) {
      finalReasons.push(reasonInput.trim());
      setReasonInput('');
      setReasonsList(finalReasons);
    }
    
    (cleanData as any).reasons = JSON.stringify(finalReasons);

    const { error } = await supabaseAuth.from('escort_missions').update(cleanData).eq('id', id);

    if (error) {
      setMsg({ text: 'Error updating mission: ' + error.message, type: 'error' });
    } else {
      // Upload Medif file if selected
      if (medifFile && formData.customer_id) {
        const filePath = `${formData.customer_id}/medif form/${medifFile.name}`;
        await supabaseAuth.storage.from('medical_escort').upload(filePath, medifFile, { upsert: true });
      }

      // Upload Passport if selected
      if (passportFile && formData.customer_id) {
        const filePath = `${formData.customer_id}/passport/${passportFile.name}`;
        const { data: pData, error: pError } = await supabaseAuth.storage.from('medical_escort').upload(filePath, passportFile, { upsert: true });
        if (!pError && pData) {
          const selectedCust = customers.find(c => c.id === formData.customer_id);
          let newPassportArray = selectedCust?.passport || [];
          if (!Array.isArray(newPassportArray)) newPassportArray = [];
          newPassportArray.push({ name: passportFile.name, path: filePath });
          await supabaseAuth.from('customers').update({ passport: newPassportArray }).eq('id', formData.customer_id);
        }
      }

      setMsg({ text: 'Mission updated successfully!', type: 'success' });
      setTimeout(() => {
        router.refresh();
        router.push('/escorts');
      }, 1500);
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.container}><LoadingIcon /></div>;

  return (
    <div className={styles.container}>
      <Link href="/escorts" className={styles.backBtn}>
        <span className="material-symbols-outlined">arrow_back</span> Back to Missions
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Escort Mission</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formSection}>Mission Details</div>
          
          <div className={styles.formGroup}>
            <label>Select Customer *</label>
            <select name="customer_id" required value={formData.customer_id} onChange={handleChange}>
              <option value="">-- Choose Customer --</option>
              {customers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Assign Escort (Employee)</label>
            <select name="escort_employee_iqama" value={formData.escort_employee_iqama} onChange={handleChange}>
              <option value="">-- Unassigned --</option>
              {employees.map(e => (
                <option key={e.iqama_number} value={e.iqama_number}>{e.name} ({e.iqama_number})</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>From Country</label>
            <input type="text" name="from_country" value={formData.from_country} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>To Country</label>
            <input type="text" name="to_country" value={formData.to_country} onChange={handleChange} />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
              <input type="checkbox" checked={hasLayover} onChange={(e) => {
                setHasLayover(e.target.checked);
                if (!e.target.checked) setFormData({...formData, layover_country: ''});
              }} />
              Flight has a layover
            </label>
          </div>
          {hasLayover && (
            <div className={styles.formGroup}>
              <label>Layover Country / City</label>
              <input type="text" name="layover_country" value={formData.layover_country || ''} onChange={handleChange} placeholder="e.g. Dubai, UAE" />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Required Date</label>
            <input type="date" name="escort_required_date" value={formData.escort_required_date} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Approximate Total Cost ($)</label>
            <input type="number" step="0.01" name="approx_cost" value={formData.approx_cost} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Flight & Logistics</div>

          <div className={styles.formGroup}>
            <label>Airline</label>
            <input type="text" name="airline" value={formData.airline} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Flight No</label>
            <input type="text" name="flight_no" value={formData.flight_no} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Flight Date</label>
            <input type="date" name="flight_date" value={formData.flight_date} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>PNR</label>
            <input type="text" name="pnr" value={formData.pnr} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Ticket Cost ($)</label>
            <input type="number" step="0.01" name="ticket_cost" value={formData.ticket_cost} onChange={handleChange} />
          </div>

          <div className={styles.formSection}>Documents</div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>MEDIF Form Upload (Optional update)</label>
            <input type="file" accept=".pdf,image/*" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setMedifFile(e.target.files[0]);
              }
            }} />
            {medifPreviews.length > 0 && (
               <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                 <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0', fontWeight: 600 }}>Currently Uploaded MEDIF Forms:</p>
                 <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                   {medifPreviews.map((file: any, idx: number) => (
                     <div key={idx} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                       <button type="button" onClick={() => removeMedifFile(file.path)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                       {file.name.toLowerCase().endsWith('.pdf') ? (
                         <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#16a34a', padding: '10px' }}>
                           <span className="material-symbols-outlined">description</span>
                           <span>{file.name}</span>
                         </a>
                       ) : (
                         <a href={file.url} target="_blank" rel="noreferrer">
                           <img src={file.url} alt="MEDIF" style={{ height: '80px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                         </a>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>

          {formData.customer_id && (() => {
            const cust = customers.find(c => c.id === formData.customer_id);
            let passportArr = cust?.passport;
            if (typeof passportArr === 'string') {
              try { passportArr = JSON.parse(passportArr); } catch(e) {}
            }
            const hasPassport = passportArr && Array.isArray(passportArr) && passportArr.length > 0;
            return (
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Passport Upload {hasPassport ? '(Add additional page)' : '(Missing for this customer)'}</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPassportFile(e.target.files[0]);
                  }
                }} />
                {hasPassport && passportPreviews.length > 0 && (
                   <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                     <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0', fontWeight: 600 }}>Currently Uploaded Passport Pages:</p>
                     <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                       {passportPreviews.map((file: any, idx: number) => (
                         <div key={idx} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#fff' }}>
                           <button type="button" onClick={() => removePassportPage(file.path)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                           {file.name.toLowerCase().endsWith('.pdf') ? (
                             <a href={file.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#2563eb', padding: '10px' }}>
                               <span className="material-symbols-outlined">picture_as_pdf</span>
                               <span>{file.name}</span>
                             </a>
                           ) : (
                             <a href={file.url} target="_blank" rel="noreferrer">
                               <img src={file.url} alt="Passport" style={{ height: '80px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }} />
                             </a>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                )}
              </div>
            );
          })()}

          <div className={styles.formSection}>Address Details</div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Boarding / Pick-up Details</label>
            <textarea name="boarding_details" rows={2} value={formData.boarding_details} onChange={handleChange}></textarea>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Destination Address / Hospital</label>
            <textarea name="destination_address" rows={2} value={formData.destination_address} onChange={handleChange}></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="" disabled>-- Status --</option>
              <option value="Pending">Pending</option>
              <option value="In-Transit">In-Transit</option>
              <option value="Completed">Completed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Reasons / Notes</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {reasonsList.map((r, i) => (
                <div key={i} style={{ background: '#fef08a', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#854d0e', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <span>{r}</span>
                  <button type="button" onClick={() => setReasonsList(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'rgba(255,255,255,0.5)', border: 'none', color: '#854d0e', cursor: 'pointer', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>&times;</button>
                </div>
              ))}
            </div>
            <input 
              type="text" 
              value={reasonInput} 
              onChange={e => setReasonInput(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (reasonInput.trim()) {
                    setReasonsList(prev => [...prev, reasonInput.trim()]);
                    setReasonInput('');
                  }
                }
              }} 
              placeholder="Type a reason and press Enter to add..." 
            />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            {msg.text && <div style={{ padding: '10px', background: msg.type === 'error' ? '#fee2e2' : '#dcfce7', color: msg.type === 'error' ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '15px' }}>{msg.text}</div>}
            <button type="submit" className={styles.submitBtn} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving Changes...' : 'Update Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





