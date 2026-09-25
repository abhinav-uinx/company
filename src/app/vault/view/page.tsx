'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VaultViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe 
        src={`/vault/view-document.html?v=${Date.now()}&id=${id || ''}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="View Document"
      />
    </div>
  );
}

export default function VaultView() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading viewer...</div>}>
      <VaultViewContent />
    </Suspense>
  );
}
