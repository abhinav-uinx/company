'use client';

export default function MedifNew() {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe 
        src={`/medif/medical-escort.html?v=${Date.now()}`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Medical Escort Service Form"
      />
    </div>
  );
}
