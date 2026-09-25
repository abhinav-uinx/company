'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';
import Cookies from 'js-cookie';
import LoadingIcon from '@/components/LoadingIcon';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const inputVal = username.trim();

      // 1. Check Admins
      let { data: adminMatch } = await supabaseAuth.from('admins').select('*').eq('username', inputVal).eq('password', password).single();
      if (!adminMatch) {
        let res = await supabaseAuth.from('admins').select('*').eq('email', inputVal).eq('password', password).single();
        adminMatch = res.data;
      }

      if (adminMatch) {
        if (adminMatch.status === 'disabled') {
          setError('Account disabled. Please contact admin.');
          setLoading(false);
          return;
        }
        Cookies.set('loggedInUser', adminMatch.username, { expires: 7 });
        Cookies.set('userRole', 'admin', { expires: 7 });
        await supabaseAuth.from('admins').update({ last_login: new Date().toISOString() }).eq('username', adminMatch.username);
        router.replace('/dashboard');
        return;
      }

      // 2. Check Employees
      let { data: empMatch } = await supabaseAuth.from('employees').select('*').eq('iqama_number', inputVal).eq('password', password).single();
      if (!empMatch) {
        let res = await supabaseAuth.from('employees').select('*').eq('email', inputVal).eq('password', password).single();
        empMatch = res.data;
      }

      if (empMatch) {
        if (empMatch.status === 'disabled') {
          setError('Account disabled. Please contact admin.');
          setLoading(false);
          return;
        }
        Cookies.set('loggedInUser', empMatch.iqama_number, { expires: 7 });
        Cookies.set('userRole', 'employee', { expires: 7 });
        await supabaseAuth.from('employees').update({ last_login: new Date().toISOString() }).eq('iqama_number', empMatch.iqama_number);
        router.replace('/dashboard');
        return;
      }

      setError('Invalid Email/Username or Password!');
    } catch (err) {
      console.error(err);
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body {
            font-family: 'Inter', sans-serif;
            background: #f4f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .login-box {
            background: #fff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        .logo {
            width: 50px;
            height: 50px;
            background: #0B1220;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: bold;
            font-size: 1.5rem;
            margin-bottom: 20px;
        }
        h2 { margin: 0 0 20px 0; color: #0B1220; }
        .form-group {
            text-align: left;
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            font-size: 0.9rem;
            color: #334155;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #4F5DFF;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover { background: #3b4be6; }
        .error { color: #ef4444; font-size: 0.85rem; margin-top: 10px; text-align: left; display: block; }
      `}} />
      <div className="login-box">
        <div className="logo">C</div>
        <h2>Portal Login</h2>
        {searchParams.get('disabled') && (
          <div className="error" style={{marginBottom: '15px'}}>Account disabled. Please contact admin. Contact Admin.</div>
        )}
        <form onSubmit={handleLogin} suppressHydrationWarning>
            <div className="form-group">
                <label>Email / Username</label>
                <input type="text" placeholder="Enter email or username" required value={username} onChange={e => setUsername(e.target.value)} suppressHydrationWarning />
            </div>
            <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    suppressHydrationWarning 
                    style={{ paddingRight: '40px' }}
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        cursor: 'pointer', 
                        color: '#94a3b8',
                        userSelect: 'none',
                        fontSize: '20px'
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
      </div>
    </>
  );
}

export default function Login() {
  return <Suspense fallback={<LoadingIcon />}><LoginContent /></Suspense>;
}
