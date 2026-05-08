export default function ConfirmPage() {
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
        textAlign: 'center',
      }}>
        <h1 style={{
          color: '#fff',
          fontFamily: "'Cinzel', serif",
          fontSize: '1.8em',
          margin: '0 0 16px',
        }}>
          Check Your Email
        </h1>
        <p style={{
          color: '#aaa',
          fontFamily: "'Crimson Text', serif",
          fontSize: '1em',
          margin: '0 0 12px',
          lineHeight: 1.6,
        }}>
          We sent you a confirmation link. Click it to activate your account and start playing.
        </p>
        <p style={{
          color: '#666',
          fontFamily: "'Crimson Text', serif",
          fontSize: '0.9em',
          margin: 0,
        }}>
          Already confirmed?{' '}
          <a href="/login" style={{ color: '#5c6bc0', textDecoration: 'none' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
