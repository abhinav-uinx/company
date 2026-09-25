'use client';
import { useEffect, useState } from 'react';
import { supabaseAuth } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Vault() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('medif');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} document(s)? This will also permanently delete all associated uploaded files.`)) return;
    
    setLoading(true);
    const docsToDelete = documents.filter(d => selectedIds.includes(d.id));

    // 1. Delete DB Records
    const { error } = await supabaseAuth.from('medif_records').delete().in('id', selectedIds);
    if (error) {
      setError("Delete failed: " + error.message);
      setLoading(false);
      return;
    }
    
    // 2. Delete Associated Storage Files (Tickets, MEDIFs, generated PDFs)
    for (const doc of docsToDelete) {
      if (!doc.passport || doc.passport === 'unknown' || doc.passport.trim() === '') continue;
      
      try {
        let filePaths: string[] = [];
        
        // Add new URL-based files to deletion list
        let allUrls: string[] = [];
        if (doc.ticketUrls) allUrls = allUrls.concat(doc.ticketUrls);
        if (doc.medifUrls) allUrls = allUrls.concat(doc.medifUrls);
        if (doc.generatedPdfUrl) allUrls.push(doc.generatedPdfUrl);
        
        allUrls.forEach((url) => {
            const match = url.match(/medif_files\/(.+)$/);
            if (match) filePaths.push(match[1]);
        });

        // Also try to list the old legacy passport root folder just in case
        const { data: legacyFiles } = await supabaseAuth.storage.from('medif_files').list(doc.passport);
        if (legacyFiles && legacyFiles.length > 0) {
            legacyFiles.forEach((f) => filePaths.push(`${doc.passport}/${f.name}`));
        }

        if (filePaths.length > 0) {
            // Deduplicate array
            filePaths = Array.from(new Set(filePaths));
            await supabaseAuth.storage.from('medif_files').remove(filePaths);
        }
      } catch (err) {
        console.error("Failed to delete storage files for passport " + doc.passport, err);
      }
    }
    
    // Update local state
    setDocuments(documents.filter(d => !selectedIds.includes(d.id)));
    setSelectedIds([]);
    setIsDeleteMode(false);
    setLoading(false);
  };
  
  const toggleSelection = (e: any, id: string) => {
    e.preventDefault();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };


  useEffect(() => {
    const fetchVault = async () => {
      try {
        const { data: records, error } = await supabaseAuth.from('medif_records').select('*');
        if (error) { setError(error.message); setLoading(false); return; }
        const allDocs = records.map(r => {
          const fData = typeof r.form_data === 'string' ? JSON.parse(r.form_data) : (r.form_data || {});
          
          let phone = 'N/A';
          try {
            if (fData.relative_phones) {
              const phones = typeof fData.relative_phones === 'string' ? JSON.parse(fData.relative_phones) : fData.relative_phones;
              if (phones.length > 0) phone = '+' + phones[0].cc + ' ' + phones[0].phone;
            }
          } catch(e) {}

          return {
            id: r.id,
            passport: r.passport,
            passengerName: r.passenger_name || fData.p_name || "Unknown",
            name: r.passenger_name || fData.p_name || "Unknown",
            flight: String(r.flight || fData.p_flight || ""),
            status: r.status || "done",
            date: new Date(r.created_at || Date.now()).toLocaleDateString(),
            formData: fData,
            nationality: fData.p_nationality || 'N/A',
            phone: phone,
            ticketUrls: r.ticket_urls || [],
            ticketCount: (r.ticket_urls || []).length,
            medifUrls: r.medif_urls || [],
            generatedPdfUrl: r.generated_pdf_url || null,
            medifCount: (r.medif_urls || []).length
          };
        });
        setDocuments(allDocs);
      } catch (err: any) {
        console.error("Vault Render Error:", err);
        setError("Error rendering vault: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, []);

  const filteredDocs = statusFilter === 'all' 
    ? documents 
    : documents.filter(d => d.status === statusFilter);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .vault-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .vault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .vault-header h1 { font-size: 2rem; margin: 0; color: #0B1220; }
        .back-btn { text-decoration: none; color: #334155; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 12px 6px 8px; display: inline-flex; align-items: center; gap: 5px; font-weight: 500; font-size: 0.85rem; transition: all 0.2s; margin-bottom: 10px; }
        .back-btn:hover { background: #f4f5f7; border-color: #d1d5db; }
        .tabs-nav { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
        .tab-btn { background: none; border: none; padding: 10px 15px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; position: relative; }
        .tab-btn.active { color: #4F5DFF; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: #4F5DFF; border-radius: 3px 3px 0 0; }
        .filter-nav { display: flex; gap: 10px; margin-bottom: 25px; }
        .filter-btn { background: #fff; border: 1px solid #e2e8f0; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .filter-btn.active { background: #0B1220; color: #fff; border-color: #0B1220; }
        .filter-btn:hover:not(.active) { background: #f4f5f7; }
        .document-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .doc-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; position: relative; text-decoration: none; color: inherit; cursor: pointer; }
        .doc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -8px rgba(0,0,0,0.1); }
        .status-badge { position: absolute; top: 15px; right: 15px; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 10px; text-transform: uppercase; }
        .status-done { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef08a; color: #854d0e; }
        .status-progress { background: #dbeafe; color: #1e40af; }
        .doc-icon { font-size: 2rem; color: #4F5DFF; }
        .doc-name { font-weight: 600; font-size: 1rem; word-break: break-all; padding-right: 60px; color: #0B1220; }
        .doc-meta { font-size: 0.8rem; color: #64748b; }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 12px; }
      
        /* --- MOBILE RESPONSIVENESS INJECTED --- */
        @media (max-width: 768px) {
          .vault-container { margin: 20px auto; padding: 0 10px; }
          .vault-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .vault-header h1 { font-size: 1.6rem; }
          .vault-header div { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; }
          .delete-actions { flex-wrap: wrap; width: 100%; }
          .delete-actions button { flex: 1; }
          
          .tabs-nav { flex-wrap: wrap; }
          .tab-btn { flex: 1 1 100%; text-align: center; }
          
          .filter-nav { flex-wrap: wrap; justify-content: flex-start; }
          .filter-btn { flex: 1 1 auto; text-align: center; font-size: 0.8rem; padding: 6px 10px; }
          
          .document-grid { grid-template-columns: 1fr; }
        }
\n      `}} />
      <header className="top-nav" style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo" style={{ width: '30px', height: '30px', background: '#0B1220', borderRadius: '6px' }}></div>
          <span className="brand-text" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0B1220' }}>Company HR</span>
        </div>
      </header>

      <main className="vault-container">
        <div className="vault-header">
          <div>
            <Link href="/dashboard" className="back-btn"><span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span> Back to Dashboard</Link>
            <h1 style={{ marginTop: '15px' }}>Document Vault</h1>
            <p style={{ color: '#64748b', marginTop: '5px' }}>All generated MEDIFs and employee documents are stored here.</p>
          </div>
        </div>

        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === 'medif' ? 'active' : ''}`} onClick={() => setActiveTab('medif')}>MEDIF FORMS</button>
          <button className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>OTHER FORMS</button>
        </div>
        
        {activeTab === 'medif' && (
          <div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div className="filter-nav" style={{ marginBottom: 0 }}>
                <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                <button className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
                <button className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in_progress')}>In Progress</button>
                <button className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`} onClick={() => setStatusFilter('done')}>Done</button>
              </div>
              <div>
                {isDeleteMode ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setIsDeleteMode(false); setSelectedIds([]); }} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleDelete} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Delete ({selectedIds.length})</button>
                  </div>
                ) : (
                  <button onClick={() => setIsDeleteMode(true)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete Documents">
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>delete</span>
                  </button>
                )}
              </div>
            </div>


            <div className="document-grid">
              {loading && <p>Loading documents...</p>}
              {error && <p className="error">{error}</p>}
              {!loading && filteredDocs.length === 0 && (
                <div className="empty-state">
                  <h3>No documents found</h3>
                  <p>Generate a MEDIF from the Medical Escort Service to see it appear here.</p>
                </div>
              )}
              
              {!loading && filteredDocs.map(medif => {
                const firstName = (medif.passengerName || medif.name || "Unknown").split(' ')[0] || 'Unknown';
                const flightStr = medif.flight ? '_' + medif.flight.replace(/\s+/g, '') : '';
                const fileName = 'MEDIF_' + firstName + flightStr + '.pdf';
                
                let badgeClass = 'status-done';
                let badgeText = 'DONE';
                if (medif.status === 'pending') { badgeClass = 'status-pending'; badgeText = 'PENDING'; }
                else if (medif.status === 'in_progress') { badgeClass = 'status-progress'; badgeText = 'IN PROGRESS'; }

                return (
                  
                  <Link 
                    key={medif.id} 
                    href={`/vault/view?id=${medif.id}`} 
                    className="doc-card"
                    onClick={(e) => {
                      if (isDeleteMode) toggleSelection(e, medif.id);
                    }}
                    style={{ border: selectedIds.includes(medif.id) ? '2px solid #ef4444' : '1px solid #e2e8f0' }}
                  >
                    {isDeleteMode && (
                      <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #ef4444', borderRadius: '4px', background: selectedIds.includes(medif.id) ? '#ef4444' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedIds.includes(medif.id) && <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>check</span>}
                        </div>
                      </div>
                    )}

                    <div className={`status-badge ${badgeClass}`}>{badgeText}</div>
                    <div className="doc-icon"><span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>picture_as_pdf</span></div>
                    <div className="doc-name">{fileName}</div>
                    <div className="doc-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong style={{color: '#334155'}}>Passenger:</strong> {(medif.passengerName || medif.name || "Unknown")}</div>
                      {medif.flight && <div><strong style={{color: '#334155'}}>Flight:</strong> {medif.flight}</div>}
                      {medif.nationality !== 'N/A' && <div><strong style={{color: '#334155'}}>Nationality:</strong> {medif.nationality}</div>}
                      {medif.phone !== 'N/A' && <div><strong style={{color: '#334155'}}>Phone:</strong> {medif.phone}</div>}
                      
                      {(medif.ticketCount > 0 || medif.medifCount > 0) && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          {medif.ticketCount > 0 && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{medif.ticketCount} Ticket(s)</span>}
                          {medif.medifCount > 0 && <span style={{ background: '#fce7f3', color: '#9d174d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{medif.medifCount} MEDIF(s)</span>}
                        </div>
                      )}

                      <div style={{ marginTop: '5px', color: medif.status === 'pending' ? '#d97706' : 'inherit', fontWeight: medif.status === 'pending' ? 600 : 500 }}>
                        {medif.status === 'done' ? 'Saved on: ' + medif.date : 'Updated on: ' + medif.date}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'other' && (
          <div className="empty-state">
            <h3>No other forms found</h3>
            <p>Additional employee documents will appear here.</p>
          </div>
        )}
      </main>
    </>
  );
}
