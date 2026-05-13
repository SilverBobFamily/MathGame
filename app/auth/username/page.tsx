'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function validate(username: string): string | null {
  if (username.length < 3) return 'Must be at least 3 characters.';
  if (username.length > 20) return 'Must be 20 characters or fewer.';
  if (!USERNAME_REGEX.test(username)) return 'Letters, numbers, and underscores only.';
  return null;
}

export default function ChooseUsernamePage() {
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);
    });
  }, []);

  const handleChange = (value: string) => {
    setUsername(value);
    setValidationError(value.length > 0 ? validate(value) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(username);
    if (err) { setValidationError(err); return; }
    if (!userId) return;

    setLoading(true);
    setSubmitError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('players')
      .insert({ id: userId, username: username.trim() });

    if (error) {
      setSubmitError(
        error.message.includes('unique') || error.message.includes('duplicate')
          ? 'That username is already taken.'
          : error.message
      );
      setLoading(false);
      return;
    }

    window.location.href = '/game';
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid #333',
        borderRadius: 14,
        padding: '40px 44px',
        width: '100%',
        maxWidth: 420,
      }}>
        <h1 style={{
          color: '#fff',
          fontFamily: "'Spectral', serif",
          fontSize: '1.8em',
          margin: '0 0 8px',
          textAlign: 'center',
        }}>
          Choose a Username
        </h1>
        <p style={{
          color: '#888',
          fontSize: '0.95em',
          textAlign: 'center',
          margin: '0 0 32px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          This is how other players will know you.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: validationError ? 6 : 24 }}>
            <label style={{
              display: 'block',
              color: '#aaa',
              fontSize: '0.85em',
              marginBottom: 6,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => handleChange(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              disabled={loading}
              placeholder="e.g. MathWizard99"
              style={{
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
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          {validationError && (
            <p style={{ color: '#ef5350', fontSize: '0.85em', margin: '0 0 14px', fontFamily: "'DM Sans', sans-serif" }}>
              {validationError}
            </p>
          )}

          {submitError && (
            <p style={{ color: '#ef5350', fontSize: '0.88em', margin: '0 0 18px', fontFamily: "'DM Sans', sans-serif" }}>
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !!validationError || username.length === 0}
            style={{
              width: '100%',
              background: (loading || !!validationError || username.length === 0) ? '#111' : '#c9a84c',
              color: (loading || !!validationError || username.length === 0) ? '#444' : '#0d0d1a',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: '0.85em',
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: (loading || !!validationError || username.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving…' : 'Start Playing →'}
          </button>
        </form>
      </div>
    </div>
  );
}
