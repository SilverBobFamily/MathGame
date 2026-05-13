'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getTodayPuzzle, scorePlay, type DailyPuzzle, type PuzzleCard } from '@/lib/puzzle';

type Phase = 'loading' | 'ready' | 'selecting_target' | 'submitted' | 'error';

interface SubmitResult {
  already_attempted?: boolean;
  is_correct?: boolean;
  xp_awarded?: number;
}

function PuzzleCardPill({ card, selected, dimmed, onClick, isTarget }: {
  card: PuzzleCard; selected?: boolean; dimmed?: boolean; onClick?: () => void; isTarget?: boolean;
}) {
  const isCreature = card.type === 'creature';
  const label = isCreature ? String(card.value ?? '?') : (card.operator ?? card.type);
  const borderColor = isTarget ? '#ffd54f' : selected ? '#a5d6a7' : '#333';
  return (
    <div
      onClick={onClick}
      style={{
        background: '#111', border: `2px solid ${borderColor}`,
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.4 : 1,
        minWidth: 72,
        transition: 'border-color 0.15s',
        boxShadow: selected ? `0 0 12px ${borderColor}66` : 'none',
      }}
    >
      <div style={{ fontSize: '1.6em' }}>{card.art_emoji}</div>
      <div style={{ color: '#fff', fontFamily: "'Cinzel', serif", fontSize: '1.1em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: '#555', fontSize: '0.65em', textAlign: 'center', maxWidth: 64, lineHeight: 1.2 }}>
        {card.name}
      </div>
    </div>
  );
}

function FieldRow({ label, cards, targetCreatureId, onTargetClick }: {
  label: string; cards: PuzzleCard[];
  targetCreatureId?: number | null;
  onTargetClick?: (id: number) => void;
}) {
  const total = cards.reduce((s, c) => s + (c.value ?? 0), 0);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#555', fontSize: '0.75em', letterSpacing: 1 }}>{label}</span>
        <span style={{ color: '#ffd54f', fontSize: '0.85em', fontWeight: 700 }}>{total}</span>
      </div>
      {cards.length === 0 ? (
        <div style={{ color: '#333', fontSize: '0.8em', fontStyle: 'italic', padding: '8px 0' }}>
          Empty field
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cards.map(c => (
            <PuzzleCardPill
              key={c.id} card={c}
              isTarget={targetCreatureId === c.id}
              onClick={onTargetClick ? () => onTargetClick(c.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PuzzlePage() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selectedCard, setSelectedCard] = useState<PuzzleCard | null>(null);
  const [targetCreatureId, setTargetCreatureId] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      try {
        const p = await getTodayPuzzle();
        if (!p) { setPhase('error'); return; }
        setPuzzle(p);

        const today = new Date().toISOString().split('T')[0];
        const { data: attempts } = await supabase
          .from('player_puzzle_attempts')
          .select('is_correct, xp_awarded')
          .eq('player_id', user.id)
          .eq('puzzle_id', p.id)
          .eq('attempted_date', today)
          .limit(1);
        if (attempts && attempts.length > 0) {
          setResult({ already_attempted: true, is_correct: attempts[0].is_correct });
          setPhase('submitted');
        } else {
          setPhase('ready');
        }
      } catch {
        setPhase('error');
      }
    }).catch(() => setPhase('error'));
  }, []);

  const needsTarget = selectedCard && (selectedCard.type === 'item' || selectedCard.type === 'action');

  async function handleSubmit() {
    if (!puzzle || !selectedCard) return;
    if (needsTarget && targetCreatureId === null) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/puzzle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          submittedCardId: selectedCard.id,
          submittedTargetSide: 'player',
          submittedCreatureId: targetCreatureId,
        }),
      });
      const data = await r.json() as SubmitResult;
      setResult(data);
      setPhase('submitted');
    } catch {
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading today&apos;s puzzle…
      </div>
    );
  }
  if (phase === 'error' || !puzzle) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350' }}>
        No puzzle available today. Check back soon!
      </div>
    );
  }

  const playerScoreBase = puzzle.player_field.reduce((s, c) => s + (c.value ?? 0), 0);
  const playerScoreAfter = selectedCard
    ? scorePlay(puzzle.player_field, selectedCard, 'player', targetCreatureId)
    : playerScoreBase;
  const oppScore = puzzle.opponent_field.reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 20px', fontFamily: "'Cinzel', serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ color: '#ffd54f', fontSize: '0.72em', letterSpacing: 2, marginBottom: 6 }}>DAILY PUZZLE</div>
        <h1 style={{ color: '#fff', fontSize: '1.6em', margin: '0 0 8px' }}>{puzzle.title}</h1>
        <p style={{ color: '#888', fontSize: '0.85em', margin: 0, fontFamily: 'sans-serif' }}>{puzzle.description}</p>
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px 16px', marginBottom: 20 }}>
        <FieldRow label="OPPONENT FIELD" cards={puzzle.opponent_field} />
        <div style={{ borderTop: '1px solid #1e1e1e', margin: '12px 0' }} />
        <FieldRow
          label="YOUR FIELD"
          cards={puzzle.player_field}
          targetCreatureId={needsTarget ? targetCreatureId : null}
          onTargetClick={needsTarget && phase === 'ready' ? (id) => setTargetCreatureId(id) : undefined}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: '0.68em', marginBottom: 2 }}>YOUR SCORE</div>
          <div style={{ color: '#a5d6a7', fontSize: '1.8em', fontWeight: 700 }}>
            {selectedCard ? playerScoreAfter : playerScoreBase}
          </div>
        </div>
        <div style={{ color: '#333', alignSelf: 'center', fontSize: '1.2em' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: '0.68em', marginBottom: 2 }}>OPPONENT</div>
          <div style={{ color: '#ef9a9a', fontSize: '1.8em', fontWeight: 700 }}>{oppScore}</div>
        </div>
      </div>

      {phase === 'ready' && (
        <>
          <div style={{ color: '#555', fontSize: '0.72em', letterSpacing: 1, marginBottom: 10 }}>
            {needsTarget ? 'NOW CLICK A TARGET CREATURE ON YOUR FIELD' : 'CHOOSE A CARD TO PLAY'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {puzzle.player_hand.map(card => (
              <PuzzleCardPill
                key={card.id}
                card={card}
                selected={selectedCard?.id === card.id}
                onClick={() => {
                  setSelectedCard(card);
                  if (card.type === 'creature') setTargetCreatureId(null);
                }}
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedCard || (!!needsTarget && targetCreatureId === null) || submitting}
            style={{
              width: '100%', padding: '14px 0',
              background: selectedCard && (!needsTarget || targetCreatureId !== null) ? '#5c6bc0' : '#1a1a1a',
              color: selectedCard && (!needsTarget || targetCreatureId !== null) ? '#fff' : '#444',
              border: 'none', borderRadius: 10,
              fontFamily: "'Cinzel', serif", fontSize: '1em', fontWeight: 700,
              cursor: selectedCard ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Answer'}
          </button>
        </>
      )}

      {phase === 'submitted' && result && (
        <div style={{
          background: result.is_correct ? '#0a2e0a' : result.already_attempted ? '#111' : '#2e0a0a',
          border: `2px solid ${result.is_correct ? '#a5d6a7' : result.already_attempted ? '#333' : '#ef9a9a'}`,
          borderRadius: 16, padding: '24px 20px', textAlign: 'center',
        }}>
          {result.already_attempted ? (
            <div style={{ color: '#aaa', fontSize: '0.9em' }}>You already solved today&apos;s puzzle!</div>
          ) : (
            <>
              <div style={{ fontSize: '2.5em', marginBottom: 8 }}>
                {result.is_correct ? '✅' : '❌'}
              </div>
              <div style={{ color: result.is_correct ? '#a5d6a7' : '#ef9a9a', fontSize: '1.3em', fontWeight: 700, marginBottom: 12 }}>
                {result.is_correct ? 'Correct!' : 'Not quite!'}
              </div>
            </>
          )}
          <p style={{ color: '#aaa', fontSize: '0.85em', fontFamily: 'sans-serif', lineHeight: 1.5, margin: '0 0 12px' }}>
            {puzzle.explanation}
          </p>
          {result.xp_awarded !== undefined && result.xp_awarded > 0 && (
            <div style={{ color: '#ffd54f', fontSize: '0.9em', fontWeight: 700 }}>
              +{result.xp_awarded} XP earned
            </div>
          )}
        </div>
      )}
    </div>
  );
}
