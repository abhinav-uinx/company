import { supabaseRealtime, supabaseAuth } from '@/lib/supabase';

// Multi-tier real-time permissions synchronization:
// 1. Supabase Realtime WebSocket Broadcast (works across browsers, incognito, devices)
// 2. Browser BroadcastChannel (works instantly across tabs in same browser)
// 3. LocalStorage StorageEvent (fallback cross-tab communication)
// 4. Custom DOM Event (same window communication)

let globalSyncChannel: any = null;

function getSyncChannel() {
  if (!globalSyncChannel) {
    try {
      globalSyncChannel = supabaseRealtime.channel('permissions_sync_channel', {
        config: { broadcast: { self: true } }
      });
      globalSyncChannel.subscribe();
    } catch (e) {
      console.warn('Realtime channel subscription error:', e);
    }
  }
  return globalSyncChannel;
}

export function notifyPermissionsChanged(targetIqama?: string) {
  const payload = {
    iqama: targetIqama || 'all',
    timestamp: Date.now()
  };

  // 1. Supabase Realtime Broadcast (cross-browser / incognito / cross-device)
  try {
    const ch = getSyncChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'permissions_changed',
        payload
      }).catch(() => {});
    }
  } catch (e) {}

  // 2. BroadcastChannel (cross-tab in same browser)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('permissions_sync');
      bc.postMessage({ type: 'PERMISSIONS_UPDATED', ...payload });
      setTimeout(() => {
        try { bc.close(); } catch (err) {}
      }, 500);
    } catch (e) {}
  }

  // 3. LocalStorage Event (cross-tab fallback)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('medescort_perms_sync', Date.now().toString());
    } catch (e) {}
  }

  // 4. Custom DOM Event (current window)
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('medescort_perms_updated', { detail: payload }));
    } catch (e) {}
  }
}

export function subscribeToPermissionsChanges(onChanged: (iqama?: string) => void): () => void {
  const cleanupFns: Array<() => void> = [];

  // 1. Supabase Realtime Broadcast
  try {
    const ch = getSyncChannel();
    if (ch) {
      const handler = (event: any) => {
        const iqama = event?.payload?.iqama;
        onChanged(iqama);
      };
      ch.on('broadcast', { event: 'permissions_changed' }, handler);
    }
  } catch (e) {}

  // 2. BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('permissions_sync');
      bc.onmessage = (event) => {
        onChanged(event?.data?.iqama);
      };
      cleanupFns.push(() => {
        try { bc.close(); } catch (e) {}
      });
    } catch (e) {}
  }

  // 3. LocalStorage StorageEvent
  if (typeof window !== 'undefined') {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'medescort_perms_sync') {
        onChanged();
      }
    };
    window.addEventListener('storage', onStorage);
    cleanupFns.push(() => window.removeEventListener('storage', onStorage));
  }

  // 4. Custom DOM Event
  if (typeof window !== 'undefined') {
    const onCustom = (e: any) => {
      onChanged(e?.detail?.iqama);
    };
    window.addEventListener('medescort_perms_updated', onCustom);
    cleanupFns.push(() => window.removeEventListener('medescort_perms_updated', onCustom));
  }

  // 5. Window focus & document visibility (throttled to at most once per 60s)
  if (typeof window !== 'undefined') {
    let lastFocusCheck = Date.now();
    const onFocus = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastFocusCheck > 60000) {
        lastFocusCheck = now;
        onChanged();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    cleanupFns.push(() => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    });
  }

  return () => {
    cleanupFns.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  };
}
