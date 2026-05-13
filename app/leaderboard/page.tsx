'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Period = 'all' | 'month' | 'week';

type LeaderboardRow = {
  rank: number;
  player_id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  wins: number;
  games_played: number;
};

type MyRank = { rank: number; wins: number } | null;

function xpToLevel(xp: number): number {
  const t = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250, 2750, 3300, 3900, 4550, 5250, 6000, 6800, 7650, 8550, 9500, 10500, 11550, 12650, 13800, 15000];
  if (xp <= 0) return 1;
  for (let i = t.length - 1; i >= 0; i--) {
    if (xp >= t[i]) return i + 1;
  }
  return 1;
}

const DISPLAY = "'Spectral', serif";
const GOLD   = '#c9a84c';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all',   label: 'All Time'   },
  { key: 'month', label: 'This Month' },
  { key: 'week',  label: 'This Week'  },
];

export default function LeaderboardPage() {
  const [period, setPeriod]         = useState<Period>('all');
  const [rows, setRows]             = useState<LeaderboardRow[]>([]);
  const [myRank, setMyRank]         = useState<MyRank>(null);
  const [myId, setMyId]             = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [myXp, setMyXp]             = useState<number>(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Load current user once on mount
  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setMyId(user.id);
      const { data } = await sb.from('players').select('username, xp').eq('id', user.id).single();
      if (data) {
        setMyUsername((data as { username: string; xp: number }).username);
        setMyXp((data as { username: string; xp: number }).xp ?? 0);
      }
    }).catch(() => { /* non-fatal: user stays logged-out view */ });
  }, []);

  const handlePeriodChange = (p: Period) => {
    setLoading(true);
    setError(null);
    setPeriod(p);
  };

  useEffect(() => {
    let cancelled = false;
    const sb = createSupabaseBrowserClient();

    sb.rpc('get_leaderboard', { p_period: period, p_limit: 50 }).then(async ({ data, error: err }) => {
      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      const leaderRows = (data ?? []) as LeaderboardRow[];
      setRows(leaderRows);

      if (myId) {
        const inTop50 = leaderRows.some(r => r.player_id === myId);
        if (!inTop50) {
          const { data: rankData } = await sb.rpc('get_player_rank', { p_player_id: myId, p_period: period });
          if (cancelled) return;
          const rankRow = ((rankData ?? []) as { rank: number; wins: number }[])[0];
          setMyRank(rankRow ? { rank: rankRow.rank, wins: rankRow.wins } : null);
        } else {
          setMyRank(null);
        }
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [period, myId]);

  const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div style={{ maxWidth: 620, margin: '48px auto', padding: '0 24px' }}>
      <style>{`
        .lb-row { border-bottom: 1px solid #111; transition: background 0.1s; }
        .lb-row:hover { background: rgba(255,255,255,0.02) !important; }
        .lb-period-btn { transition: all 0.15s; }
        .lb-period-btn:hover { color: #999 !important; border-color: #555 !important; }
      `}</style>

      <h1 style={{ fontFamily: DISPLAY, color: GOLD, fontSize: '1.9em', textAlign: 'center', margin: '0 0 8px', fontWeight: 700 }}>
        Leaderboard
      </h1>
      <p style={{ textAlign: 'center', color: '#444', fontSize: '0.78em', margin: '0 0 28px', fontFamily: "'DM Sans', sans-serif" }}>
        Top players by wins
      </p>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
        {PERIODS.map(p => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              className="lb-period-btn"
              aria-pressed={active}
              onClick={() => handlePeriodChange(p.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.8em', padding: '7px 20px',
                borderRadius: 6, border: '1px solid',
                borderColor: active ? GOLD : '#2a2a2a',
                background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: active ? GOLD : '#555',
                cursor: 'pointer', fontWeight: active ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#444', padding: '60px 0', fontStyle: 'italic' }}>Loading…</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', color: '#ef5350', padding: '60px 0' }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '60px 0', fontStyle: 'italic', fontSize: '0.9em' }}>
              No games played {period === 'all' ? 'yet' : 'this ' + (period === 'month' ? 'month' : 'week')}.
            </div>
          ) : (
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 56px 60px', borderBottom: '1px solid #1e1e1e', padding: '8px 16px' }}>
                {[['center','#'], ['left','Player'], ['center','Lv'], ['right','Wins']].map(([align, h]) => (
                  <div key={h} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.68em', color: '#3a3a3a',
                    textAlign: align as 'left' | 'right' | 'center',
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
                  }}>{h}</div>
                ))}
              </div>

              {rows.map((row, i) => {
                const isMe = row.player_id === myId;
                const isTop3 = row.rank <= 3;
                return (
                  <div
                    key={row.player_id}
                    className="lb-row"
                    style={{
                      display: 'grid', gridTemplateColumns: '52px 1fr 56px 60px',
                      alignItems: 'center',
                      padding: '11px 16px',
                      background: isMe ? 'rgba(201,168,76,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      {isTop3
                        ? <span style={{ fontSize: '1.1em', lineHeight: 1 }}>{MEDALS[row.rank]}</span>
                        : <span style={{ color: '#333', fontFamily: DISPLAY, fontSize: '0.85em' }}>{row.rank}</span>
                      }
                    </div>
                    <div>
                      <a
                        href={`/players/${row.username}`}
                        style={{
                          color: isMe ? GOLD : isTop3 ? '#ddd' : '#999',
                          textDecoration: 'none',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.88em',
                          fontWeight: isTop3 || isMe ? 600 : 400,
                        }}
                      >
                        {row.username}{isMe ? ' ★' : ''}
                      </a>
                    </div>
                    <div style={{ textAlign: 'center', color: '#444', fontSize: '0.78em', fontFamily: "'DM Sans', sans-serif" }}>
                      {xpToLevel(row.xp)}
                    </div>
                    <div style={{
                      textAlign: 'right',
                      color: isTop3 ? GOLD : '#666',
                      fontFamily: DISPLAY,
                      fontSize: '0.92em',
                      fontWeight: isTop3 ? 700 : 400,
                    }}>
                      {row.wins}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current user's row pinned below top 50 (only when not in top 50) */}
          {myId && myRank && myUsername && (
            <>
              <div style={{ margin: '12px 0 0', position: 'relative', textAlign: 'center' }}>
                <span style={{
                  color: '#333', fontSize: '0.68em', padding: '0 8px',
                  fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  · · · your rank · · ·
                </span>
              </div>
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, marginTop: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 56px 60px', alignItems: 'center', padding: '11px 16px' }}>
                  <div style={{ textAlign: 'center', color: '#444', fontFamily: DISPLAY, fontSize: '0.85em' }}>{myRank.rank}</div>
                  <div>
                    <a href={`/players/${myUsername}`} style={{ color: GOLD, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88em', fontWeight: 600 }}>
                      {myUsername} ★
                    </a>
                  </div>
                  <div style={{ textAlign: 'center', color: '#444', fontSize: '0.78em', fontFamily: "'DM Sans', sans-serif" }}>{xpToLevel(myXp)}</div>
                  <div style={{ textAlign: 'right', color: '#666', fontFamily: DISPLAY, fontSize: '0.92em' }}>{myRank.wins}</div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
