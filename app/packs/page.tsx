'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const CINZEL = "'Cinzel', serif";
const GOLD   = '#c9a84c';

type Release = { id: number; name: string; icon: string; number: number; color_hex: string; unowned_count: number };
type RevealCard = { card_id: number; name: string; type: string; art_emoji: string; art_url: string | null; flavor_text: string; release_id: number };

const PACK_TYPES = [
  {
    key: 'random_release' as const,
    label: 'Random Pack',
    cost: 50,
    desc: '3 unowned cards from any public release',
    icon: '🎲',
  },
  {
    key: 'same_release' as const,
    label: 'Release Pack',
    cost: 100,
    desc: '3 unowned cards from one release of your choice',
    icon: '📦',
  },
];

type PackType = 'random_release' | 'same_release';

const TYPE_COLORS: Record<string, string> = {
  creature: '#5c6bc0',
  item:     '#66bb6a',
  action:   '#ef5350',
  event:    '#ab47bc',
};

export default function PacksPage() {
  const [coins, setCoins]               = useState<number | null>(null);
  const [releases, setReleases]         = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<number | null>(null);
  const [buying, setBuying]             = useState<PackType | null>(null);
  const [buyError, setBuyError]         = useState<string | null>(null);
  const [revealCards, setRevealCards]   = useState<RevealCard[] | null>(null);
  const [flipped, setFlipped]           = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }

      const [coinRes, releaseRes] = await Promise.all([
        sb.from('players').select('coins').eq('id', user.id).single(),
        sb.rpc('get_releases_with_unowned'),
      ]);

      if (coinRes.data) setCoins((coinRes.data as { coins: number }).coins);
      setReleases((releaseRes.data ?? []) as Release[]);
    }).catch(() => { window.location.href = '/login'; });
  }, []);

  const handleBuy = async (packType: PackType) => {
    setBuying(packType);
    setBuyError(null);

    try {
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packType,
          releaseId: packType === 'same_release' ? selectedRelease : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setBuyError(json.error ?? 'Something went wrong.');
        return;
      }

      // Deduct coins optimistically
      setCoins(prev => prev !== null ? prev - (packType === 'same_release' ? 100 : 50) : null);

      // Update release unowned counts after same_release purchase
      if (packType === 'same_release' && selectedRelease !== null) {
        setReleases(prev => prev
          .map(r => r.id === selectedRelease ? { ...r, unowned_count: Math.max(0, r.unowned_count - 3) } : r)
          .filter(r => r.unowned_count > 0)
        );
        setSelectedRelease(null);
      }

      // Start animated reveal
      const cards: RevealCard[] = json.cards;
      setRevealCards(cards);
      setFlipped([false, false, false]);

      // Flip cards one at a time with stagger
      [0, 1, 2].forEach(i => {
        setTimeout(() => {
          setFlipped(prev => { const next = [...prev]; next[i] = true; return next; });
        }, 600 + i * 700);
      });
    } finally {
      setBuying(null);
    }
  };

  return (
    <>
      <style>{`
        .pack-card-flip {
          perspective: 800px;
        }
        .pack-card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }
        .pack-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .pack-card-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          border-radius: 12px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 12px;
        }
        .pack-card-back-face {
          background: #0a0a0a;
          border: 2px solid ${GOLD};
          font-size: 2em;
        }
        .pack-card-front-face {
          background: #111;
          border: 2px solid #333;
          transform: rotateY(180deg);
          gap: 6px;
          text-align: center;
        }
      `}</style>

      <div style={{ maxWidth: 600, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontFamily: CINZEL, color: GOLD, fontSize: '2em', textAlign: 'center', margin: '0 0 8px' }}>
          Pack Shop
        </h1>

        {coins !== null && (
          <p style={{ textAlign: 'center', color: '#ffd54f', fontFamily: CINZEL, margin: '0 0 32px' }}>
            🪙 {coins.toLocaleString()} coins
          </p>
        )}

        {buyError && (
          <div style={{
            background: '#2a0000', border: '1px solid #ef5350', borderRadius: 8,
            padding: '10px 16px', color: '#ef5350', marginBottom: 24, textAlign: 'center',
          }}>
            {buyError}
          </div>
        )}

        {/* Pack type cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          {PACK_TYPES.map(pack => {
            const canAfford    = coins !== null && coins >= pack.cost;
            const needsRelease = pack.key === 'same_release' && selectedRelease === null;
            const noOptions    = pack.key === 'same_release' && releases.length === 0;
            const disabled     = buying !== null || !canAfford || needsRelease || noOptions;

            return (
              <div
                key={pack.key}
                style={{
                  background: '#111', border: '1px solid #222', borderRadius: 12,
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12,
                }}
              >
                <div style={{ fontSize: '2em', textAlign: 'center' }}>{pack.icon}</div>
                <h2 style={{ fontFamily: CINZEL, color: '#fff', fontSize: '1em', textAlign: 'center', margin: 0 }}>
                  {pack.label}
                </h2>
                <p style={{ color: '#666', fontSize: '0.8em', textAlign: 'center', margin: 0 }}>
                  {pack.desc}
                </p>
                <div style={{ textAlign: 'center', color: GOLD, fontFamily: CINZEL, fontSize: '1.1em' }}>
                  🪙 {pack.cost}
                </div>

                {pack.key === 'same_release' && (
                  noOptions ? (
                    <p style={{ color: '#444', fontSize: '0.78em', textAlign: 'center', margin: 0 }}>
                      No unowned cards available
                    </p>
                  ) : (
                    <select
                      value={selectedRelease ?? ''}
                      onChange={e => setSelectedRelease(Number(e.target.value) || null)}
                      style={{
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: 6,
                        color: '#ccc', fontFamily: CINZEL, fontSize: '0.8em',
                        padding: '6px 10px', width: '100%', cursor: 'pointer',
                      }}
                    >
                      <option value="">— choose release —</option>
                      {releases.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.icon} R{r.number} {r.name} ({r.unowned_count} left)
                        </option>
                      ))}
                    </select>
                  )
                )}

                <button
                  onClick={() => handleBuy(pack.key)}
                  disabled={disabled}
                  style={{
                    fontFamily: CINZEL, fontSize: '0.85em', padding: '8px 0',
                    borderRadius: 8, border: '1px solid',
                    borderColor: canAfford && !needsRelease && !noOptions ? GOLD : '#333',
                    background: canAfford && !needsRelease && !noOptions ? '#1a1200' : 'transparent',
                    color: canAfford && !needsRelease && !noOptions ? GOLD : '#444',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {buying === pack.key ? 'Opening…' : 'Open Pack'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Animated card reveal */}
        {revealCards && (
          <>
            <h2 style={{ fontFamily: CINZEL, color: GOLD, textAlign: 'center', fontSize: '1.2em', marginBottom: 20 }}>
              You got:
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {revealCards.map((card, i) => (
                <div key={card.card_id} className="pack-card-flip" style={{ height: 180 }}>
                  <div className={`pack-card-inner${flipped[i] ? ' flipped' : ''}`}>
                    {/* Card back (shown initially) */}
                    <div className="pack-card-face pack-card-back-face">
                      ✦
                    </div>
                    {/* Card front (revealed after flip) */}
                    <div className="pack-card-face pack-card-front-face">
                      <div style={{ fontSize: '2.5em', lineHeight: 1 }}>{card.art_emoji}</div>
                      <div style={{
                        fontFamily: CINZEL, color: '#fff', fontSize: '0.75em',
                        fontWeight: 700, marginTop: 4,
                      }}>
                        {card.name}
                      </div>
                      <div style={{
                        background: TYPE_COLORS[card.type] ?? '#555',
                        color: '#fff', fontSize: '0.6em', padding: '2px 8px',
                        borderRadius: 10, fontFamily: CINZEL, textTransform: 'capitalize',
                      }}>
                        {card.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { setRevealCards(null); setFlipped([false, false, false]); setBuyError(null); }}
                style={{
                  fontFamily: CINZEL, fontSize: '0.85em', padding: '8px 24px',
                  borderRadius: 8, border: `1px solid ${GOLD}`,
                  background: 'transparent', color: GOLD, cursor: 'pointer',
                }}
              >
                Open Another Pack
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
