'use server';

import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { UAParser } from 'ua-parser-js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

// High-performance in-memory cache to prevent redundant DB round trips on every subrequest
const sessionCache = new Map<string, { isActive: boolean; lastChecked: number; lastActiveUpdated: number }>();

export async function login(inputVal: string, password: string) {
  // Check rate limit first
  const { data: attemptData } = await supabaseAdmin.from('login_attempts').select('*').eq('identifier', inputVal).single();
  
  if (attemptData && attemptData.lockout_until) {
      const lockoutTime = new Date(attemptData.lockout_until).getTime();
      const now = Date.now();
      if (lockoutTime > now) {
          return { success: false, error: 'Too many attempts. Account locked.', lockout_until: attemptData.lockout_until };
      } else if (attemptData.attempts >= 10) {
          await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
      }
  }

  try {
    const loginTime = new Date().toISOString();

    // 1. Check Admins
    let { data: adminMatch } = await supabaseAdmin.from('admins').select('*').eq('username', inputVal).eq('password', password).single();
    if (!adminMatch) {
      const res = await supabaseAdmin.from('admins').select('*').eq('email', inputVal).eq('password', password).single();
      adminMatch = res.data;
    }

    if (adminMatch) {
      if (adminMatch.status === 'disabled') {
        return { success: false, error: 'Account disabled. Please contact admin.' };
      }
      if (attemptData && attemptData.attempts > 0) {
        await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
      }

      // Record last_login in admins table with exact timestamp
      await supabaseAdmin.from('admins').update({ last_login: loginTime }).eq('username', adminMatch.username);

      await createSession(adminMatch.username, 'admin', adminMatch.name || adminMatch.username);
      return { success: true, role: 'admin' };
    }

    // 2. Check Employees
    let { data: empMatch } = await supabaseAdmin.from('employees').select('*').eq('iqama_number', inputVal).eq('password', password).single();
    if (!empMatch) {
      const res = await supabaseAdmin.from('employees').select('*').eq('email', inputVal).eq('password', password).single();
      empMatch = res.data;
    }

    if (empMatch) {
      if (empMatch.status === 'disabled') {
        return { success: false, error: 'Account disabled. Please contact admin.' };
      }
      if (attemptData && attemptData.attempts > 0) {
        await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', inputVal);
      }

      // Record last_login in employees table with exact timestamp
      await supabaseAdmin.from('employees').update({ last_login: loginTime }).eq('iqama_number', empMatch.iqama_number);

      if (empMatch.must_change_password) {
        return { success: true, role: 'employee', mustChangePassword: true, identifier: empMatch.iqama_number, tempPassword: password };
      }
      await createSession(empMatch.iqama_number, 'employee', empMatch.name || empMatch.iqama_number);
      return { success: true, role: 'employee' };
    }

    // Handle Failure
    const currentAttempts = attemptData ? attemptData.attempts + 1 : 1;
    const updates: any = { identifier: inputVal, attempts: currentAttempts, last_attempt: new Date().toISOString() };
    if (currentAttempts >= 10) {
        updates.lockout_until = new Date(Date.now() + 60 * 1000).toISOString();
    }
    await supabaseAdmin.from('login_attempts').upsert([updates]);
    
    if (currentAttempts >= 10) {
        return { success: false, error: 'Too many attempts. Account locked for 1 minute.', lockout_until: updates.lockout_until };
    }
    return { success: false, error: 'Invalid credentials. ' + (10 - currentAttempts) + ' attempts remaining.' };

  } catch (err: any) {
    return { success: false, error: 'An error occurred during login' };
  }
}

export async function logout() {
  const sessionToken = cookies().get('session')?.value;
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
      if (payload.session_id) {
        sessionCache.delete(payload.session_id as string);
        await supabaseAdmin.from('active_sessions').update({ is_active: false }).eq('id', payload.session_id);
      }
    } catch (e) {
      // ignore token parse errors on logout
    }
  }
  cookies().delete('session');
  cookies().set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

export async function terminateSession(sessionId: string) {
    sessionCache.delete(sessionId);
    const { error } = await supabaseAdmin.from('active_sessions').update({ is_active: false }).eq('id', sessionId);
    return { success: !error };
}

export async function getActiveSessions() {
    const session = await getSession();
    if (!session) return [];
    
    const { data } = await supabaseAdmin.from('active_sessions')
        .select('*')
        .eq('username', session.username)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
    return data || [];
}

async function createSession(username: string, role: string, name?: string) {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
  if (ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
  }
  
  // Parse User Agent
  const parser = new UAParser(userAgent);
  const browserName = parser.getBrowser().name || 'Browser';
  const browserVer = parser.getBrowser().version || '';
  const browser = `${browserName} ${browserVer}`.trim();
  
  const osName = parser.getOS().name || 'OS';
  const osVer = parser.getOS().version || '';
  const os = `${osName} ${osVer}`.trim();
  
  const device = parser.getDevice().model || parser.getDevice().vendor || parser.getDevice().type || 'Desktop';
  
  // Detect Real IP and Location
  let location = 'Unknown Location';
  const isLocal = !ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    // When local, query ip-api directly with no path so it detects the public IP
    const url = isLocal ? 'http://ip-api.com/json/' : `http://ip-api.com/json/${ipAddress}`;
    const geoRes = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const geoData = await geoRes.json();
    if (geoData.status === 'success') {
      const region = geoData.regionName ? `${geoData.regionName}, ` : '';
      location = `${geoData.city}, ${region}${geoData.country}`;
      if (isLocal && geoData.query) {
        ipAddress = geoData.query;
      }
    }
  } catch (e) {
    // ignore geo fetch errors or timeout
  }

  if (!ipAddress) {
    ipAddress = '127.0.0.1';
  }

  const now = new Date().toISOString();

  // Insert session record with all connection details
  const { data: sessionRecord } = await supabaseAdmin.from('active_sessions').insert([{
      username,
      role,
      ip_address: ipAddress,
      location,
      user_agent: userAgent,
      browser,
      os,
      device,
      created_at: now,
      last_active: now,
      is_active: true
  }]).select('id').single();

  const sessionId = sessionRecord?.id;
  const displayName = name || username;

  if (sessionId) {
    sessionCache.set(sessionId, {
      isActive: true,
      lastChecked: Date.now(),
      lastActiveUpdated: Date.now()
    });
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const token = await new SignJWT({ username, role, name: displayName, session_id: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

export async function getSession() {
  const sessionToken = cookies().get('session')?.value;
  if (!sessionToken) return null;

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    
    // If it has a session ID, verify it is still active using fast in-memory cache
    if (payload.session_id) {
        const sId = payload.session_id as string;
        const now = Date.now();
        const cached = sessionCache.get(sId);

        let isActive = true;
        // If checked in the last 30 seconds, use cached status (eliminates 1.5s DB delay)
        if (cached && (now - cached.lastChecked < 30000)) {
            isActive = cached.isActive;
        } else {
            const { data: sessionRecord } = await supabaseAdmin.from('active_sessions')
                .select('is_active')
                .eq('id', sId)
                .single();
                
            if (!sessionRecord || !sessionRecord.is_active) {
                sessionCache.delete(sId);
                cookies().delete('session');
                return null;
            }

            isActive = true;
            sessionCache.set(sId, {
                isActive: true,
                lastChecked: now,
                lastActiveUpdated: cached?.lastActiveUpdated || now
            });
        }

        if (!isActive) {
            cookies().delete('session');
            return null;
        }
        
        // Throttled non-blocking last_active update (at most once every 2 minutes)
        const currentEntry = sessionCache.get(sId);
        if (!currentEntry || (now - currentEntry.lastActiveUpdated > 120000)) {
            if (currentEntry) currentEntry.lastActiveUpdated = now;
            Promise.resolve(
                supabaseAdmin.from('active_sessions')
                    .update({ last_active: new Date().toISOString() })
                    .eq('id', sId)
            ).catch(() => {});
        }
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

export async function checkAuthStatus(loggedInUser: string, role: string) {
  try {
    const table = role === 'admin' ? 'admins' : 'employees';
    const idField = role === 'admin' ? 'username' : 'iqama_number';
    const { data, error } = await supabaseAdmin.from(table).select('status, permissions').eq(idField, loggedInUser).single();
    if (error || !data) return null;
    return { status: data.status, permissions: data.permissions };
  } catch (err) {
    return null;
  }
}

export async function updatePassword(identifier: string, oldPass: string, newPass: string) {
    const { data: empMatch } = await supabaseAdmin.from('employees').select('*').eq('iqama_number', identifier).eq('password', oldPass).single();
    if (!empMatch) return { success: false, error: 'Invalid credentials' };
    
    await supabaseAdmin.from('employees').update({ password: newPass, must_change_password: false }).eq('iqama_number', identifier);
    await createSession(empMatch.iqama_number, 'employee', empMatch.name || empMatch.iqama_number);
    return { success: true };
}
