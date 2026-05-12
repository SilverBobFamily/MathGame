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

const CINZEL = "'Cinzel', serif";
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
    });
  }, []);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    setLoading(true);
    setError(null);

    sb.rpc('get_leaderboard', { p_period: period, p_limit: 50 }).then(async ({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return; }
      const leaderRows = (data ?? []) as LeaderboardRow[];
      setRows(leaderRows);

      if (myId) {
        const inTop50 = leaderRows.some(r => r.player_id === myId);
        if (!inTop50) {
          const { data: rankData } = await sb.rpc('get_player_rank', { p_player_id: myId, p_period: period });
          const rankRow = ((rankData ?? []) as { rank: number; wins: number }[])[0];
          setMyRank(rankRow ? { rank: rankRow.rank, wins: rankRow.wins } : null);
        } else {
          setMyRank(null);
        }
      }
      setLoading(false);
    });
  }, [period, myId]);

  return (
    <div style={{ maxWidth: 680, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: CINZEL, color: GOLD, fontSize: '2em', textAlign: 'center', margin: '0 0 28px' }}>
        Leaderboard
      </h1>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              fontFamily: CINZEL, fontSize: '0.85em', padding: '6px 18px',
              borderRadius: 20, border: '1px solid',
              borderColor: period === p.key ? GOLD : '#333',
              background: period === p.key ? '#1a1200' : 'transparent',
              color: period === p.key ? GOLD : '#666',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>Loading…</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', color: '#ef5350', padding: '60px 0' }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '60px 0' }}>
              No games played {period === 'all' ? 'yet' : 'this ' + (period === 'month' ? 'month' : 'week')}.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {['#', 'Player', 'Lv', 'Wins'].map(h => (
                    <th key={h} style={{
                      fontFamily: CINZEL, fontSize: '0.72em', color: '#555',
                      padding: '4px 10px', textAlign: h === '#' ? 'center' : h === 'Wins' ? 'right' : 'left',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const isMe = row.player_id === myId;
                  return (
                    <tr
                      key={row.player_id}
                      style={{
                        borderBottom: '1px solid #111',
                        background: isMe ? 'rgba(201,168,76,0.07)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px', textAlign: 'center', color: row.rank <= 3 ? GOLD : '#555', fontFamily: CINZEL, fontSize: '0.9em', fontWeight: row.rank <= 3 ? 700 : 400 }}>
                        {row.rank}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <a
                          href={`/players/${row.username}`}
                          style={{ color: isMe ? GOLD : '#ccc', textDecoration: 'none', fontFamily: CINZEL, fontSize: '0.9em' }}
                        >
                          {row.username}{isMe ? ' (you)' : ''}
                        </a>
                      </td>
                      <td style={{ padding: '10px', color: '#666', fontSize: '0.85em', fontFamily: CINZEL }}>
                        {xpToLevel(row.xp)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#fff', fontFamily: CINZEL, fontSize: '0.95em', fontWeight: 600 }}>
                        {row.wins}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Current user's row pinned below top 50 (only when not in top 50) */}
          {myRank && myUsername && (
            <>
              <div style={{ borderTop: '1px dashed #333', margin: '8px 0', position: 'relative' }}>
                <span style={{
                  position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--theme-bg)', color: '#444', fontSize: '0.7em', padding: '0 8px',
                  fontFamily: CINZEL, whiteSpace: 'nowrap',
                }}>
                  your rank
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ background: 'rgba(201,168,76,0.07)' }}>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#555', fontFamily: CINZEL, fontSize: '0.9em', width: 40 }}>
                      {myRank.rank}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <a href={`/players/${myUsername}`} style={{ color: GOLD, textDecoration: 'none', fontFamily: CINZEL, fontSize: '0.9em' }}>
                        {myUsername} (you)
                      </a>
                    </td>
                    <td style={{ padding: '10px', color: '#666', fontSize: '0.85em', fontFamily: CINZEL }}>
                      {xpToLevel(myXp)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#fff', fontFamily: CINZEL, fontSize: '0.95em', fontWeight: 600 }}>
                      {myRank.wins}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}
