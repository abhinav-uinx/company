'use server';

import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { UAParser } from 'ua-parser-js';
import { hashPassword, verifyPassword, isBcryptHash } from '@/lib/passwords';
import { sanitizeIdentifier, validatePasswordNist } from '@/lib/security';
import { logSecurityEvent } from '@/lib/securityAudit';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

// Session idle inactivity timeout: 2 hours of inactivity (NIST SP 800-63B Section 7.2)
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

// High-performance in-memory cache to prevent redundant DB round trips on every subrequest
const sessionCache = new Map<string, { isActive: boolean; lastChecked: number; lastActiveUpdated: number }>();

export async function login(inputVal: string, password: string) {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  if (ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }

  // 1. Sanitize user identifier (NIST SP 800-53 SI-10)
  const cleanIdentifier = sanitizeIdentifier(inputVal);
  if (!cleanIdentifier || !password) {
    return { success: false, error: 'Invalid credentials.' };
  }

  // 2. Check rate limit & lockout (NIST SP 800-63B Section 5.2.2)
  const { data: attemptData } = await supabaseAdmin.from('login_attempts').select('*').eq('identifier', cleanIdentifier).single();
  
  if (attemptData && attemptData.lockout_until) {
    const lockoutTime = new Date(attemptData.lockout_until).getTime();
    const now = Date.now();
    if (lockoutTime > now) {
      await logSecurityEvent({
        eventType: 'AUTH_ACCOUNT_LOCKED',
        severity: 'WARN',
        actor: cleanIdentifier,
        ipAddress,
        userAgent,
        details: { lockout_until: attemptData.lockout_until }
      });
      return {
        success: false,
        error: 'Too many failed attempts. Account temporarily locked for security.',
        lockout_until: attemptData.lockout_until
      };
    } else if (attemptData.attempts >= 10) {
      await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', cleanIdentifier);
    }
  }

  try {
    const loginTime = new Date().toISOString();

    // 3. Authenticate Admins (case-insensitive lookup by username or email)
    let { data: adminMatch } = await supabaseAdmin.from('admins').select('*').eq('username', cleanIdentifier).single();
    if (!adminMatch) {
      const res = await supabaseAdmin.from('admins').select('*').ilike('username', cleanIdentifier).single();
      adminMatch = res.data;
    }
    if (!adminMatch) {
      const res = await supabaseAdmin.from('admins').select('*').ilike('email', cleanIdentifier).single();
      adminMatch = res.data;
    }

    if (adminMatch && adminMatch.password) {
      const isPassValid = await verifyPassword(password, adminMatch.password);
      if (isPassValid) {
        if (adminMatch.status === 'disabled') {
          await logSecurityEvent({
            eventType: 'ACCESS_DENIED',
            severity: 'WARN',
            actor: adminMatch.username,
            ipAddress,
            userAgent,
            details: { reason: 'Account disabled' }
          });
          return { success: false, error: 'Account disabled. Please contact admin.' };
        }

        // Auto-upgrade legacy plaintext password to bcrypt hash in DB
        if (!isBcryptHash(adminMatch.password)) {
          const hashed = await hashPassword(password);
          await supabaseAdmin.from('admins').update({ password: hashed }).eq('username', adminMatch.username);
        }

        if (attemptData && attemptData.attempts > 0) {
          await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', cleanIdentifier);
        }

        // Record last_login in admins table with exact timestamp
        await supabaseAdmin.from('admins').update({ last_login: loginTime }).eq('username', adminMatch.username);

        await logSecurityEvent({
          eventType: 'AUTH_LOGIN_SUCCESS',
          severity: 'INFO',
          actor: adminMatch.username,
          ipAddress,
          userAgent,
          details: { role: 'admin' }
        });

        await createSession(adminMatch.username, 'admin', adminMatch.name || adminMatch.username);
        return { success: true, role: 'admin' };
      }
    }

    // 4. Authenticate Employees (case-insensitive lookup by iqama_number or email)
    let { data: empMatch } = await supabaseAdmin.from('employees').select('*').eq('iqama_number', cleanIdentifier).single();
    if (!empMatch) {
      const res = await supabaseAdmin.from('employees').select('*').ilike('email', cleanIdentifier).single();
      empMatch = res.data;
    }

    if (empMatch && empMatch.password) {
      const isPassValid = await verifyPassword(password, empMatch.password);
      if (isPassValid) {
        if (empMatch.status === 'disabled') {
          await logSecurityEvent({
            eventType: 'ACCESS_DENIED',
            severity: 'WARN',
            actor: empMatch.iqama_number,
            ipAddress,
            userAgent,
            details: { reason: 'Account disabled' }
          });
          return { success: false, error: 'Account disabled. Please contact admin.' };
        }

        // Auto-upgrade legacy plaintext password to bcrypt hash in DB
        if (!isBcryptHash(empMatch.password)) {
          const hashed = await hashPassword(password);
          await supabaseAdmin.from('employees').update({ password: hashed }).eq('id', empMatch.id);
        }

        if (attemptData && attemptData.attempts > 0) {
          await supabaseAdmin.from('login_attempts').update({ attempts: 0, lockout_until: null }).eq('identifier', cleanIdentifier);
        }

        // Record last_login in employees table with exact timestamp
        await supabaseAdmin.from('employees').update({ last_login: loginTime }).eq('iqama_number', empMatch.iqama_number);

        await logSecurityEvent({
          eventType: 'AUTH_LOGIN_SUCCESS',
          severity: 'INFO',
          actor: empMatch.iqama_number,
          ipAddress,
          userAgent,
          details: { role: 'employee' }
        });

        if (empMatch.must_change_password) {
          return { success: true, role: 'employee', mustChangePassword: true, identifier: empMatch.iqama_number, tempPassword: password };
        }
        await createSession(empMatch.iqama_number, 'employee', empMatch.name || empMatch.iqama_number);
        return { success: true, role: 'employee' };
      }
    }

    // 5. Handle Authentication Failure (NIST SP 800-63B progressive backoff & uniform error)
    const currentAttempts = attemptData ? attemptData.attempts + 1 : 1;
    const updates: any = { identifier: cleanIdentifier, attempts: currentAttempts, last_attempt: new Date().toISOString() };
    if (currentAttempts >= 10) {
      // 15-minute lockout compliant with NIST progressive lockout guidelines
      updates.lockout_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await logSecurityEvent({
        eventType: 'AUTH_ACCOUNT_LOCKED',
        severity: 'WARN',
        actor: cleanIdentifier,
        ipAddress,
        userAgent,
        details: { attempts: currentAttempts, lockout_minutes: 15 }
      });
    } else {
      await logSecurityEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        severity: 'WARN',
        actor: cleanIdentifier,
        ipAddress,
        userAgent,
        details: { attempts: currentAttempts }
      });
    }
    await supabaseAdmin.from('login_attempts').upsert([updates]);
    
    if (currentAttempts >= 10) {
      return { success: false, error: 'Too many attempts. Account locked for 15 minutes.', lockout_until: updates.lockout_until };
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
      if (payload.username) {
        await logSecurityEvent({
          eventType: 'AUTH_LOGOUT',
          severity: 'INFO',
          actor: payload.username as string,
          details: { role: payload.role }
        });
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
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    sessionCache.delete(sessionId);
    let query = supabaseAdmin.from('active_sessions').update({ is_active: false }).eq('id', sessionId);
    if (session.role !== 'admin') {
      query = query.eq('username', session.username);
    }
    const { error } = await query;
    return { success: !error };
}

export async function getCurrentUserLoginInfo() {
  const session = await getSession();
  if (!session) return null;

  const details: {
    username: string;
    role: string;
    name: string;
    email: string;
    department: string;
    job_title: string;
    phone_number: string;
    photo_url: string;
    last_login: string | null;
  } = {
    username: (session.username as string) || '',
    role: (session.role as string) || 'employee',
    name: (session.name as string) || (session.username as string) || 'User',
    email: '',
    department: '',
    job_title: '',
    phone_number: '',
    photo_url: '',
    last_login: null,
  };

  try {
    if (session.role === 'admin') {
      const { data } = await supabaseAdmin.from('admins').select('*').eq('username', session.username).single();
      if (data) {
        details.name = data.name || details.name;
        details.email = data.email || '';
        details.photo_url = data.photo_url || '';
        details.last_login = data.last_login || null;
      }
    } else {
      let { data } = await supabaseAdmin.from('employees').select('*').eq('iqama_number', session.username).single();
      if (!data) {
        const res = await supabaseAdmin.from('employees').select('*').eq('email', session.username).single();
        data = res.data;
      }
      if (data) {
        details.name = data.name || details.name;
        details.email = data.email || '';
        details.department = data.department || '';
        details.job_title = data.job_title || '';
        details.phone_number = data.phone_number || '';
        details.photo_url = data.photo_url || '';
        details.last_login = data.last_login || null;
      }
    }
  } catch (e) {
    // ignore
  }

  return details;
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
                .select('is_active, last_active')
                .eq('id', sId)
                .single();
                
            if (!sessionRecord || !sessionRecord.is_active) {
                sessionCache.delete(sId);
                cookies().delete('session');
                return null;
            }

            // Enforce idle inactivity timeout (NIST SP 800-63B Section 7.2)
            if (sessionRecord.last_active) {
                const lastActiveTime = new Date(sessionRecord.last_active).getTime();
                if (now - lastActiveTime > SESSION_IDLE_TIMEOUT_MS) {
                    sessionCache.delete(sId);
                    await supabaseAdmin.from('active_sessions').update({ is_active: false }).eq('id', sId);
                    cookies().delete('session');
                    await logSecurityEvent({
                        eventType: 'AUTH_SESSION_EXPIRED',
                        severity: 'INFO',
                        actor: (payload.username as string) || 'unknown',
                        details: { reason: 'Idle timeout exceeded (NIST SP 800-63B)' }
                    });
                    return null;
                }
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

export async function getAuthAndPermissions(): Promise<{
  username: string;
  role: string;
  name: string;
  status: string;
  permissions: string[];
} | null> {
  const session = await getSession();
  if (!session) return null;

  const role = (session.role as string) || '';
  const username = (session.username as string) || '';
  const name = (session.name as string) || username;

  // Ultra-fast admin path: 0 DB queries, instant response
  if (role === 'admin') {
    const allFolders = ['customers', 'escorts', 'general_services', 'documentation', 'invoices', 'vault', 'reports', 'forms', 'salary'];
    return {
      username,
      role: 'admin',
      name,
      status: 'active',
      permissions: allFolders,
    };
  }

  try {
    // Single query for employee status and permissions
    const { data: emp } = await supabaseAdmin
      .from('employees')
      .select('id, status, permissions')
      .eq('iqama_number', username)
      .single();

    const empStatus = emp?.status || 'active';
    if (empStatus === 'disabled') {
      return {
        username,
        role: 'employee',
        name,
        status: 'disabled',
        permissions: [],
      };
    }

    const { data: dbPerms } = await supabaseAdmin
      .from('employee_folder_permissions')
      .select('*')
      .eq('employee_iqama', username);

    let allowed: string[] = [];

    if (dbPerms && dbPerms.length > 0) {
      const row = dbPerms[0];
      if (row.customers !== undefined || row.escorts !== undefined) {
        const folderCols = ['customers', 'escorts', 'general_services', 'invoices', 'vault', 'reports', 'forms'];
        folderCols.forEach(col => {
          const val = row[col];
          if (val && val !== 'disabled') {
            allowed.push(col);
          }
        });
      } else {
        allowed = dbPerms
          .filter(p => p.is_enabled && p.permission_level !== 'disabled' && p.folder_id)
          .map(p => p.folder_id);
      }
    } else if (emp && emp.permissions !== undefined && emp.permissions !== null) {
      let raw = emp.permissions;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = []; }
      }
      if (Array.isArray(raw)) {
        allowed = raw;
      } else if (typeof raw === 'object') {
        allowed = Object.keys(raw).filter(k => raw[k]?.enabled && raw[k]?.permission !== 'disabled');
      }
    }

    // Include aliases
    if (allowed.includes('general_services') && !allowed.includes('documentation')) {
      allowed.push('documentation');
    }
    if (allowed.includes('documentation') && !allowed.includes('general_services')) {
      allowed.push('general_services');
    }

    return {
      username,
      role: 'employee',
      name,
      status: empStatus,
      permissions: allowed,
    };
  } catch (err) {
    console.error('Error in getAuthAndPermissions:', err);
    return {
      username,
      role: 'employee',
      name,
      status: 'active',
      permissions: [],
    };
  }
}

export async function getCurrentUserPermissions(): Promise<{
  role: string;
  status: string;
  permissions: string[];
  allowedFolders: string[];
}> {
  const auth = await getAuthAndPermissions();
  if (!auth) {
    return { role: '', status: '', permissions: [], allowedFolders: [] };
  }
  return {
    role: auth.role,
    status: auth.status,
    permissions: auth.permissions,
    allowedFolders: auth.permissions,
  };
}

export async function updatePassword(identifier: string, oldPass: string, newPass: string) {
    const cleanId = sanitizeIdentifier(identifier);
    if (!cleanId) {
      return { success: false, error: 'Invalid user identifier' };
    }

    // NIST SP 800-63B Section 5.1.1.2 Password Policy Validation
    const validation = validatePasswordNist(newPass, cleanId);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Password does not meet NIST security standards' };
    }

    if (oldPass && newPass.trim() === oldPass.trim()) {
      return { success: false, error: 'New password cannot be identical to your current password' };
    }

    // 1. Try finding employee by iqama_number or email
    let { data: empMatch } = await supabaseAdmin.from('employees').select('*').eq('iqama_number', cleanId).single();
    if (!empMatch) {
      const res = await supabaseAdmin.from('employees').select('*').eq('email', cleanId).single();
      empMatch = res.data;
    }

    if (empMatch) {
      const isOldValid = await verifyPassword(oldPass, empMatch.password);
      if (!isOldValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
      const hashedNewPass = await hashPassword(newPass.trim());
      const { error: updateErr } = await supabaseAdmin.from('employees').update({
        password: hashedNewPass,
        must_change_password: false
      }).eq('id', empMatch.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      await logSecurityEvent({
        eventType: 'AUTH_PASSWORD_CHANGED',
        severity: 'INFO',
        actor: empMatch.iqama_number,
        details: { role: 'employee' }
      });

      await createSession(empMatch.iqama_number, 'employee', empMatch.name || empMatch.iqama_number);
      return { success: true };
    }

    // 2. Try finding admin by username or email
    let { data: adminMatch } = await supabaseAdmin.from('admins').select('*').eq('username', cleanId).single();
    if (!adminMatch) {
      const res = await supabaseAdmin.from('admins').select('*').eq('email', cleanId).single();
      adminMatch = res.data;
    }

    if (adminMatch) {
      const isOldValid = await verifyPassword(oldPass, adminMatch.password);
      if (!isOldValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
      const hashedNewPass = await hashPassword(newPass.trim());
      const { error: updateErr } = await supabaseAdmin.from('admins').update({
        password: hashedNewPass
      }).eq('username', adminMatch.username);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      await logSecurityEvent({
        eventType: 'AUTH_PASSWORD_CHANGED',
        severity: 'INFO',
        actor: adminMatch.username,
        details: { role: 'admin' }
      });

      await createSession(adminMatch.username, 'admin', adminMatch.name || adminMatch.username);
      return { success: true };
    }

    return { success: false, error: 'Account not found' };
}
