'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/game');
    }
  };

  const busy = loading || googleLoading;

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <style>{`
        @media (min-width: 769px) {
          .auth-card { max-width: 290px !important; padding: 22px 24px !important; }
        }
        .auth-field { font-family: 'DM Sans', sans-serif !important; }
        .auth-field::placeholder { color: #3e3e50; font-family: 'DM Sans', sans-serif !important; }
        .auth-field:focus { border-color: #3a3a55 !important; outline: none; }
      `}</style>

      <div className="auth-card" style={{
        background: '#111',
        border: '1px solid #1e1e2e',
        borderRadius: 14,
        padding: '28px 28px',
        width: '100%',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        <img
          src="/mathemagic-logo.svg"
          alt="Mathemagic"
          style={{ height: 46, marginBottom: 12 }}
        />

        <p style={{
          color: '#b8a878',
          fontFamily: "'Spectral', serif",
          fontStyle: 'italic',
          fontSize: '1.05em',
          margin: '0 0 18px',
          textAlign: 'center',
        }}>
          Welcome, Mathemagician!
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: 8 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={busy}
            placeholder="Email"
            className="auth-field"
            style={{
              width: '100%',
              background: '#0d0d1a',
              border: '1px solid #252535',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              padding: '10px 13px',
              color: '#ccc',
              fontSize: '0.95em',
              outline: 'none',
              boxSizing: 'border-box',
              opacity: busy ? 0.6 : 1,
              display: 'block',
            }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={busy}
            placeholder="Password"
            className="auth-field"
            style={{
              width: '100%',
              background: '#0d0d1a',
              border: '1px solid #252535',
              borderRadius: '0 0 8px 8px',
              padding: '10px 13px',
              color: '#ccc',
              fontSize: '0.95em',
              outline: 'none',
              boxSizing: 'border-box',
              opacity: busy ? 0.6 : 1,
              display: 'block',
              marginBottom: 10,
            }}
          />

          {error && (
            <p style={{
              color: '#ef5350',
              fontSize: '0.85em',
              margin: '0 0 10px',
              fontFamily: "'DM Sans', sans-serif",
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              background: busy ? '#1e1a0e' : '#c9a84c',
              color: busy ? '#4a4030' : '#1a1000',
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontSize: '0.82em',
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: busy ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          disabled={busy}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#0d0d1a',
            color: busy ? '#333' : '#666',
            border: '1px solid #252535',
            borderRadius: 8,
            padding: '9px 14px',
            fontSize: '0.74em',
            fontFamily: "'DM Sans', sans-serif",
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.5 : 1,
            whiteSpace: 'nowrap',
            marginBottom: 16,
            letterSpacing: '0.02em',
          }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Sign in with Google'}
        </button>

        <p style={{
          color: '#3a3a4a',
          fontSize: '0.8em',
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 2px',
          textAlign: 'center',
        }}>
          No account?
        </p>
        <a href="/signup" style={{
          color: '#c9a84c',
          fontSize: '0.8em',
          fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'none',
        }}>
          Sign up
        </a>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
