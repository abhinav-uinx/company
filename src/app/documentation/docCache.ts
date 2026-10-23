// Cache utility for ultra-fast, zero-loading General Services navigation and editing
const RECORDS_KEY = 'medescort_gs_records';
const DOC_TYPES_KEY = 'medescort_gs_doc_types';

let memRecords: any[] | null = null;
let memDocTypes: any[] | null = null;

export function getGeneralServicesCache(): any[] | null {
  if (memRecords && memRecords.length > 0) return memRecords;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(RECORDS_KEY);
      if (stored) {
        memRecords = JSON.parse(stored);
        return memRecords;
      }
    } catch {}
  }
  return null;
}

export function setGeneralServicesCache(data: any[]): void {
  memRecords = data;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(RECORDS_KEY, JSON.stringify(data));
    } catch {}
  }
}

export function getDocTypesCache(): any[] | null {
  if (memDocTypes && memDocTypes.length > 0) return memDocTypes;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(DOC_TYPES_KEY);
      if (stored) {
        memDocTypes = JSON.parse(stored);
        return memDocTypes;
      }
    } catch {}
  }
  return null;
}

export function setDocTypesCache(data: any[]): void {
  memDocTypes = data;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(DOC_TYPES_KEY, JSON.stringify(data));
    } catch {}
  }
}

export function updateRecordInCache(id: string, updates: Record<string, any>): void {
  let list = getGeneralServicesCache();
  if (list) {
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setGeneralServicesCache(updated);
  }
}

export function prependRecordToCache(record: any): void {
  let list = getGeneralServicesCache() || [];
  const updated = [record, ...list.filter((r) => r.id !== record.id)];
  setGeneralServicesCache(updated);
}

export function removeRecordFromCache(id: string): void {
  let list = getGeneralServicesCache();
  if (list) {
    const updated = list.filter((r) => r.id !== id);
    setGeneralServicesCache(updated);
  }
}
