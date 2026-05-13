interface Props {
  playerName: string;
  onReady: () => void;
}

export default function HandoffScreen({ playerName, onReady }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24,
      }}
    >
      <div style={{ color: '#555', fontSize: '0.9em', letterSpacing: 3, textTransform: 'uppercase' }}>
        Pass the device
      </div>
      <div style={{ color: '#fff', fontSize: '2.5em', fontFamily: "'Spectral', serif", fontWeight: 700 }}>
        {playerName}&rsquo;s Turn
      </div>
      <button
        onClick={onReady}
        style={{
          marginTop: 16,
          background: '#c9a84c',
          color: '#0d0d1a',
          border: 'none',
          borderRadius: 10,
          padding: '14px 40px',
          fontSize: '1.1em',
          cursor: 'pointer',
          fontFamily: "'Spectral', serif",
          fontWeight: 700,
        }}
      >
        I&rsquo;m Ready →
      </button>
    </div>
  );
}
