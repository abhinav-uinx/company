// High-speed client-side cache for instant zero-latency data rendering
const isBrowser = typeof window !== 'undefined';

const memoryStore: Record<string, any[]> = {};

export function getCachedData<T = any>(key: string): T[] | null {
  if (memoryStore[key] && memoryStore[key].length > 0) {
    return memoryStore[key] as T[];
  }
  if (isBrowser) {
    try {
      const stored = sessionStorage.getItem(`medescort_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryStore[key] = parsed;
        return parsed as T[];
      }
    } catch {}
  }
  return null;
}

export function setCachedData<T = any>(key: string, data: T[]): void {
  memoryStore[key] = data;
  if (isBrowser) {
    try {
      sessionStorage.setItem(`medescort_${key}`, JSON.stringify(data));
    } catch {}
  }
}

export function updateItemInCache<T extends { id?: string }>(key: string, id: string, updates: Partial<T>): void {
  let list = getCachedData<T>(key);
  if (list) {
    const updated = list.map((item: any) => (item.id === id ? { ...item, ...updates } : item));
    setCachedData(key, updated);
  }
}

export function prependItemToCache<T extends { id?: string }>(key: string, item: T): void {
  let list = getCachedData<T>(key) || [];
  const updated = [item, ...list.filter((existing: any) => existing.id !== item.id)];
  setCachedData(key, updated);
}

export function removeItemFromCache(key: string, id: string): void {
  let list = getCachedData(key);
  if (list) {
    const updated = list.filter((item: any) => item.id !== id);
    setCachedData(key, updated);
  }
}

export function invalidateCache(key: string): void {
  delete memoryStore[key];
  if (isBrowser) {
    try {
      sessionStorage.removeItem(`medescort_${key}`);
    } catch {}
  }
}
