'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function validateUsername(username: string): string | null {
  if (username.length < 3) return 'Username must be at least 3 characters.';
  if (username.length > 20) return 'Username must be 20 characters or fewer.';
  if (!USERNAME_REGEX.test(username)) return 'Username may only contain letters, numbers, and underscores.';
  return null;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
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

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length > 0) {
      setUsernameError(validateUsername(value));
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // Players row is created by DB trigger on auth.users insert.
    router.push('/signup/confirm');
  };

  const busy = loading || googleLoading;

  const inputStyle = (isDisabled: boolean): React.CSSProperties => ({
    width: '100%',
    background: '#0d0d1a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#eee',
    fontSize: '1em',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    opacity: isDisabled ? 0.6 : 1,
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#888',
    fontSize: '0.82em',
    marginBottom: 5,
    fontFamily: "'DM Sans', sans-serif",
  };

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
          .auth-card { max-width: 320px !important; padding: 22px 26px !important; }
          .auth-heading { font-size: 1.2em !important; }
          .auth-input { padding: 8px 12px !important; font-size: 0.92em !important; }
          .auth-btn-primary { padding: 10px !important; }
          .auth-btn-google { padding: 8px 14px !important; font-size: 0.85em !important; }
        }
      `}</style>
      <div className="auth-card" style={{
        background: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: 14,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 className="auth-heading" style={{
          color: '#e8e0d0',
          fontFamily: "'Spectral', serif",
          fontSize: '1.5em',
          margin: '0 0 4px',
          textAlign: 'center',
        }}>
          Create Account
        </h1>
        <p style={{
          color: '#666',
          fontSize: '0.88em',
          textAlign: 'center',
          margin: '0 0 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Begin your journey, Mathemagician
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="auth-btn-google"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#0d0d1a',
            color: busy ? '#444' : '#ccc',
            border: '1px solid #3a3a4a',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: '0.9em',
            fontFamily: "'DM Sans', sans-serif",
            cursor: busy ? 'not-allowed' : 'pointer',
            marginBottom: 14,
            opacity: busy ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
          <span style={{ color: '#555', fontSize: '0.8em', fontFamily: "'DM Sans', sans-serif" }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={busy}
              className="auth-input"
              style={inputStyle(busy)}
            />
          </div>

          <div style={{ marginBottom: usernameError ? 4 : 14 }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              required
              autoComplete="username"
              disabled={busy}
              className="auth-input"
              style={inputStyle(busy)}
            />
          </div>

          {usernameError && (
            <p style={{
              color: '#ef5350',
              fontSize: '0.85em',
              margin: '0 0 14px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {usernameError}
            </p>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={busy}
              className="auth-input"
              style={inputStyle(busy)}
            />
          </div>

          {error && (
            <p style={{
              color: '#ef5350',
              fontSize: '0.88em',
              margin: '0 0 18px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !!usernameError}
            className="auth-btn-primary"
            style={{
              width: '100%',
              background: (busy || !!usernameError) ? '#111' : '#c9a84c',
              color: (busy || !!usernameError) ? '#444' : '#0d0d1a',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: '1em',
              fontFamily: "'Spectral', serif",
              cursor: (busy || !!usernameError) ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          margin: '16px 0 0',
          color: '#555',
          fontSize: '0.85em',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#c9a84c', textDecoration: 'none' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
