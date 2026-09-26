'use server';

import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { UAParser } from 'ua-parser-js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function login(inputVal: string, password: string) {
  try {
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
      await createSession(adminMatch.username, 'admin');
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
      await createSession(empMatch.iqama_number, 'employee');
      return { success: true, role: 'employee' };
    }

    return { success: false, error: 'Invalid credentials' };

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
        await supabaseAdmin.from('active_sessions').update({ is_active: false }).eq('id', payload.session_id);
      }
    } catch (e) {
      // ignore token parse errors on logout
    }
  }
  cookies().delete('session');
}

export async function terminateSession(sessionId: string) {
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

async function createSession(username: string, role: string) {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP';
  if (ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
  }
  
  // Parse User Agent
  const parser = new UAParser(userAgent);
  const browserName = parser.getBrowser().name;
  const browserVer = parser.getBrowser().version;
  const browser = browserName ? browserName + ' ' + (browserVer || '') : 'Unknown Browser';
  
  const osName = parser.getOS().name;
  const osVer = parser.getOS().version;
  const os = osName ? osName + ' ' + (osVer || '') : 'Unknown OS';
  
  const device = parser.getDevice().model || parser.getDevice().vendor || 'Desktop/Unknown';
  
  // Try to get location
  let location = 'Unknown Location';
  
  // For local testing: if the IP is localhost, we will simulate a public IP (e.g. Google's IP) 
  // so you can see the Geo-Location feature working!
  let queryIp = ipAddress;
  if (queryIp === '::1' || queryIp === '127.0.0.1') {
      queryIp = '8.8.8.8'; // Simulated Public IP for testing
  }

  if (queryIp !== 'Unknown IP') {
      try {
          const geoRes = await fetch('http://ip-api.com/json/' + queryIp);
          const geoData = await geoRes.json();
          if (geoData.status === 'success') {
              location = geoData.city + ', ' + geoData.country;
              if (queryIp === '8.8.8.8') {
                  location += ' (Simulated for Localhost)';
              }
          }
      } catch(e) {
          // ignore geo fetch errors
      }
  }

  // Insert into DB
  const { data: sessionRecord } = await supabaseAdmin.from('active_sessions').insert([{
      username,
      role,
      ip_address: ipAddress,
      location,
      user_agent: userAgent,
      browser,
      os,
      device,
      is_active: true
  }]).select('id').single();

  const sessionId = sessionRecord?.id;

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const token = await new SignJWT({ username, role, session_id: sessionId })
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
    
    // If it has a session ID, verify it's still active
    if (payload.session_id) {
        const { data: sessionRecord } = await supabaseAdmin.from('active_sessions')
            .select('is_active')
            .eq('id', payload.session_id)
            .single();
            
        if (!sessionRecord || !sessionRecord.is_active) {
            cookies().delete('session');
            return null;
        }
        
        // Update last_active timestamp
        await supabaseAdmin.from('active_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('id', payload.session_id);
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



