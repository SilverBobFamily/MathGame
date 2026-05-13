export default function Home() {
  return (
    <main style={{
      minHeight: 'calc(100vh - 102px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px 64px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        .home-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 55% at 50% 38%, oklch(0.22 0.04 280 / 0.7) 0%, transparent 65%),
            radial-gradient(ellipse 60% 30% at 50% 80%, oklch(0.16 0.02 60 / 0.3) 0%, transparent 60%);
          pointer-events: none;
        }
        .home-logo {
          width: 100%;
          max-width: 500px;
          border-radius: 18px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 8px 48px oklch(0.7 0.12 65 / 0.15));
          margin-bottom: 32px;
        }
        .home-tagline {
          font-family: 'Spectral', serif;
          font-style: italic;
          font-weight: 600;
          color: oklch(0.68 0.06 65);
          font-size: 1.08em;
          text-align: center;
          max-width: 44ch;
          line-height: 1.55;
          margin: 0 0 40px;
          letter-spacing: 0.01em;
          position: relative;
          z-index: 1;
        }
        .home-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        .home-btn-primary {
          background: #c9a84c;
          color: #0d0d1a;
          border: none;
          border-radius: 9px;
          padding: 14px 36px;
          font-size: 0.92em;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: background 0.15s, transform 0.12s;
          cursor: pointer;
          display: inline-block;
        }
        .home-btn-primary:hover {
          background: #d9b85c;
          transform: translateY(-2px);
        }
        .home-btn-ghost {
          background: transparent;
          color: #555;
          border: 1px solid #2a2a2a;
          border-radius: 9px;
          padding: 14px 36px;
          font-size: 0.92em;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: color 0.15s, border-color 0.15s;
          cursor: pointer;
          display: inline-block;
        }
        .home-btn-ghost:hover {
          color: #888;
          border-color: #3a3a3a;
        }
        .home-divider {
          width: 1px;
          height: 64px;
          background: linear-gradient(to bottom, transparent, #222, transparent);
          margin: 48px auto 0;
          position: relative;
          z-index: 1;
        }
        .home-features {
          display: flex;
          gap: 40px;
          margin-top: 48px;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
          justify-content: center;
        }
        .home-feature {
          text-align: center;
          max-width: 18ch;
        }
        .home-feature-icon {
          font-size: 1.6em;
          margin-bottom: 10px;
          line-height: 1;
        }
        .home-feature-label {
          color: #888;
          font-size: 0.72em;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .home-logo { max-width: 340px; margin-bottom: 24px; }
          .home-btn-primary, .home-btn-ghost { flex: 1 1 140px; text-align: center; }
          .home-features { gap: 28px; margin-top: 36px; }
        }
      `}</style>

      <div className="home-glow" />

      <img
        src="/mathemagic-logo-bg.webp"
        alt="Mathemagic"
        className="home-logo"
      />

      <p className="home-tagline">
        A collectible card game where the math is the magic.
      </p>

      <div className="home-ctas">
        <a href="/game" className="home-btn-primary">⚔ Play Now</a>
        <a href="/cards" className="home-btn-ghost">Browse Cards</a>
      </div>

      <div className="home-divider" />

      <div className="home-features">
        {[
          { icon: '🃏', label: 'Collect cards across 80+ releases' },
          { icon: '🧮', label: 'Build score with math operators' },
          { icon: '⚡', label: 'Play vs AI or pass & play' },
          { icon: '🏆', label: 'Daily puzzles & leaderboards' },
        ].map(f => (
          <div key={f.label} className="home-feature">
            <div className="home-feature-icon">{f.icon}</div>
            <div className="home-feature-label">{f.label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
