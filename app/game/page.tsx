'use client';
import { useEffect, useState, useCallback } from 'react';
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { fetchReleases, fetchCardsByReleaseIds } from '@/lib/supabase';
import { getActiveReleaseIds, setActiveReleaseIds } from '@/lib/releases';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { loadPreferencesFromDb, savePreferencesToDb } from '@/lib/preferences';
import { buildBalancedDecks } from '@/lib/deck';
import { fetchDecks, fetchDeckWithCards } from '@/lib/decks';
import { createGame, endTurn, passTurn, isGameOver, shouldEnterSuddenDeath, enterSuddenDeath, playCreature, playModifier, playEvent } from '@/lib/GameEngine';
import { chooseAiMove } from '@/lib/ai';
import { getGameOptions, setGameOptions, DEFAULT_OPTIONS } from '@/lib/options';
import GameBoard from '@/components/GameBoardV2';
import type { Release, Card, GameState, GameOptions, Side, Deck } from '@/lib/types';

type Mode = 'ai' | 'pass-and-play';
type CoinFlipStage = 'calling' | 'flipping' | 'result';

interface PendingCoinFlip {
  playerDeck: Card[];
  opponentDeck: Card[];
  mode: Mode;
  stage: CoinFlipStage;
  call?: 'heads' | 'tails';
  result?: 'heads' | 'tails';
  winner?: Side;
}

// ── Small UI helpers ────────────────────────────────────────────────

function SegControl<T extends string | number>({
  label, options, labels, value, onChange, disabled, isMobile,
}: {
  label: string;
  options: T[];
  labels?: string[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
      <span style={{ color: disabled ? '#555' : '#aaa', fontSize: '0.82em', width: isMobile ? 90 : 148, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {options.map((opt, i) => {
          const active = value === opt;
          return (
            <button
              key={String(opt)}
              onClick={() => !disabled && onChange(opt)}
              disabled={disabled}
              style={{
                background: active ? '#5c6bc0' : '#111',
                color: disabled ? '#444' : active ? '#fff' : '#777',
                border: `1px solid ${active ? '#5c6bc0' : '#2a2a2a'}`,
                borderRadius: 5,
                padding: '4px 11px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.8em',
                fontWeight: active ? 700 : 400,
              }}
            >
              {labels?.[i] ?? String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange, isMobile }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; isMobile?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ color: '#aaa', fontSize: '0.82em', width: isMobile ? 90 : 148, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{ background: '#111', color: value <= min ? '#333' : '#aaa', border: '1px solid #2a2a2a', borderRadius: 5, width: 28, height: 28, cursor: value <= min ? 'not-allowed' : 'pointer', fontSize: '1em' }}
        >−</button>
        <span style={{ color: '#fff', fontSize: '0.85em', width: 28, textAlign: 'center' }}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{ background: '#111', color: value >= max ? '#333' : '#aaa', border: '1px solid #2a2a2a', borderRadius: 5, width: 28, height: 28, cursor: value >= max ? 'not-allowed' : 'pointer', fontSize: '1em' }}
        >+</button>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange, disabled, isMobile }: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; isMobile?: boolean;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <span style={{ color: disabled ? '#555' : '#aaa', fontSize: '0.82em', width: isMobile ? 90 : 148, flexShrink: 0 }}>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={e => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        style={{ width: 16, height: 16, cursor: disabled ? 'not-allowed' : 'pointer', accentColor: '#5c6bc0' }}
      />
    </label>
  );
}

// ── Coin Flip Modal ────────────────────────────────────────────────

// ── Name Input Modal (pass-and-play) ───────────────────────────────

function NameInputModal({ onConfirm }: {
  onConfirm: (player: string, opponent: string) => void;
}) {
  const [p1, setP1] = useState('Player 1');
  const [p2, setP2] = useState('Player 2');
  const inputStyle: React.CSSProperties = {
    background: '#111', color: '#eee', border: '1px solid #333',
    borderRadius: 7, padding: '9px 13px', fontSize: '1em',
    outline: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', boxSizing: 'border-box',
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
        padding: '40px 48px', textAlign: 'center', maxWidth: 360, width: '100%',
      }}>
        <h2 style={{ color: '#fff', fontFamily: "'Spectral', serif", margin: '0 0 8px' }}>Who&apos;s Playing?</h2>
        <p style={{ color: '#888', fontSize: '0.85em', margin: '0 0 24px' }}>Enter names for each player</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, textAlign: 'left' }}>
          <div>
            <label style={{ color: '#aaa', fontSize: '0.8em', display: 'block', marginBottom: 5 }}>Player 1</label>
            <input
              value={p1}
              onChange={e => setP1(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onConfirm(p1.trim() || 'Player 1', p2.trim() || 'Player 2')}
              style={inputStyle}
              maxLength={20}
            />
          </div>
          <div>
            <label style={{ color: '#aaa', fontSize: '0.8em', display: 'block', marginBottom: 5 }}>Player 2</label>
            <input
              value={p2}
              onChange={e => setP2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onConfirm(p1.trim() || 'Player 1', p2.trim() || 'Player 2')}
              style={inputStyle}
              maxLength={20}
            />
          </div>
        </div>
        <button
          onClick={() => onConfirm(p1.trim() || 'Player 1', p2.trim() || 'Player 2')}
          style={startBtn}
        >
          Start Game →
        </button>
      </div>
    </div>
  );
}

// ── Coin Flip Modal ────────────────────────────────────────────────

function CoinFlipModal({ flip, playerNames, onCall, onStart }: {
  flip: PendingCoinFlip;
  playerNames: { player: string; opponent: string };
  onCall: (call: 'heads' | 'tails') => void;
  onStart: () => void;
}) {
  const coin = flip.stage === 'result'
    ? (flip.result === 'heads' ? '🪙' : '🔵')
    : '🪙';

  const isPassAndPlay = flip.mode === 'pass-and-play';
  const winnerName = flip.winner === 'player'
    ? (isPassAndPlay ? playerNames.player : 'You')
    : (isPassAndPlay ? playerNames.opponent : 'Opponent');
  const winner = `${winnerName} goes first!`;
  const correct = flip.call === flip.result;

  return (
    <>
      <style>{`
        @keyframes coinSpin {
          0%   { transform: rotateY(0deg) scale(1); }
          40%  { transform: rotateY(720deg) scale(1.3); }
          100% { transform: rotateY(1440deg) scale(1); }
        }
        .coin-spinning { animation: coinSpin 1.1s ease-out forwards; }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}>
        <div style={{
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
          padding: '40px 48px', textAlign: 'center', maxWidth: 340,
        }}>
          {flip.stage === 'calling' && (
            <>
              <div style={{ fontSize: '3.5em', marginBottom: 16 }}>🪙</div>
              <h2 style={{ color: '#fff', fontFamily: "'Spectral', serif", margin: '0 0 8px' }}>Call it!</h2>
              <p style={{ color: '#888', fontSize: '0.85em', margin: '0 0 24px' }}>Winner goes first</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => onCall('heads')} style={callBtn}>Heads</button>
                <button onClick={() => onCall('tails')} style={callBtn}>Tails</button>
              </div>
            </>
          )}
          {flip.stage === 'flipping' && (
            <>
              <div className="coin-spinning" style={{ fontSize: '3.5em', marginBottom: 16 }}>{coin}</div>
              <p style={{ color: '#888', fontSize: '0.9em' }}>Flipping…</p>
            </>
          )}
          {flip.stage === 'result' && (
            <>
              <div style={{ fontSize: '3.5em', marginBottom: 16 }}>{coin}</div>
              <h2 style={{ color: '#fff', fontFamily: "'Spectral', serif", margin: '0 0 6px', textTransform: 'capitalize' }}>
                {flip.result}!
              </h2>
              <p style={{ color: correct ? '#81c784' : '#ef5350', fontSize: '0.9em', margin: '0 0 4px' }}>
                {correct ? 'Nice call!' : 'Wrong call!'}
              </p>
              <p style={{ color: '#ccc', fontSize: '1em', margin: '0 0 24px' }}>{winner}</p>
              <button onClick={onStart} style={startBtn}>Let&apos;s go →</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const callBtn: React.CSSProperties = {
  background: '#1a237e', color: '#fff', border: '2px solid #5c6bc0',
  borderRadius: 8, padding: '10px 28px', fontSize: '1em', cursor: 'pointer',
};
const startBtn: React.CSSProperties = {
  background: '#1b5e20', color: '#fff', border: '2px solid #81c784',
  borderRadius: 8, padding: '10px 32px', fontSize: '1em', cursor: 'pointer',
};

// ── Main Page ──────────────────────────────────────────────────────

export default function GamePage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [activeReleaseIds, setActiveIds] = useState<number[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<Mode>('ai');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState(false);
  const [aiEventPending, setAiEventPending] = useState<{ card: Card; nextState: GameState } | null>(null);
  const [options, setOptionsState] = useState<GameOptions | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [releasesOpen, setReleasesOpen] = useState(false);
  const [savedDefault, setSavedDefault] = useState(false);
  const [coinFlip, setCoinFlip] = useState<PendingCoinFlip | null>(null);
  const [playerNames, setPlayerNames] = useState<{ player: string; opponent: string }>({ player: 'Player 1', opponent: 'Player 2' });
  const [nameInputPending, setNameInputPending] = useState(false);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const isMobile = useWindowWidth() < 640;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    fetchReleases(supabase).then(async r => {
      setReleases([...r].sort((a, b) => a.name.localeCompare(b.name)));
      setOptionsState(getGameOptions());

      const validIds = new Set(r.map(rel => rel.id));
      const filterValid = (ids: number[]) => ids.filter(id => validIds.has(id));

      const dbPrefs = await loadPreferencesFromDb(supabase);

      if (dbPrefs) {
        // Logged in — use DB preferences
        setIsSignedIn(true);
        const localIds = getActiveReleaseIds();
        if (dbPrefs.activeReleaseIds !== null) {
          // Filter out stale IDs that no longer exist in the current releases list
          const valid = filterValid(dbPrefs.activeReleaseIds);
          setActiveIds(valid.length > 0 ? valid : r.map(rel => rel.id));
        } else {
          // No DB prefs yet — seed from localStorage and persist silently
          const idsToUse = filterValid(localIds ?? []);
          const toSave = idsToUse.length > 0 ? idsToUse : r.map(rel => rel.id);
          setActiveIds(toSave);
          await savePreferencesToDb(supabase, { activeReleaseIds: toSave, learningMode: dbPrefs.learningMode });
        }
        setLearningMode(dbPrefs.learningMode);
        // Load user's saved decks
        fetchDecks(supabase).then(setUserDecks).catch(() => {});
      } else {
        // Logged out — use localStorage
        const stored = getActiveReleaseIds();
        const valid = stored ? filterValid(stored) : null;
        setActiveIds(valid?.length ? valid : r.map(rel => rel.id));
      }

      setLoading(false);
    });
  }, []);

  const updateOption = useCallback(<K extends keyof GameOptions>(key: K, value: GameOptions[K]) => {
    setOptionsState(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      setGameOptions(next);
      return next;
    });
  }, []);

  const toggleRelease = useCallback((id: number) => {
    setStartError(null);
    setActiveIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const saveAsDefault = useCallback(async () => {
    setActiveReleaseIds(activeReleaseIds);
    const supabase = createSupabaseBrowserClient();
    await savePreferencesToDb(supabase, { activeReleaseIds, learningMode });
    setSavedDefault(true);
    setTimeout(() => setSavedDefault(false), 1500);
  }, [activeReleaseIds, learningMode]);

  const startGame = useCallback(async (m: Mode) => {
    if (!options || activeReleaseIds.length < 2 || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const pool = await fetchCardsByReleaseIds(activeReleaseIds, supabase);
      let playerDeck: Card[];
      let opponentDeck: Card[];
      if (options.customDeckId) {
        try {
          const customDeck = await fetchDeckWithCards(options.customDeckId, supabase);
          playerDeck = customDeck.cards;
          opponentDeck = buildBalancedDecks(pool, { eventCount: options.eventCount }).opponentDeck;
        } catch {
          // Stale deck ID — fall back to balanced
          setStartError('Custom deck not found — using auto-balanced decks.');
          updateOption('customDeckId', null);
          const balanced = buildBalancedDecks(pool, { eventCount: options.eventCount });
          playerDeck = balanced.playerDeck;
          opponentDeck = balanced.opponentDeck;
        }
      } else {
        const balanced = buildBalancedDecks(pool, { eventCount: options.eventCount });
        playerDeck = balanced.playerDeck;
        opponentDeck = balanced.opponentDeck;
      }
      setMode(m);
      if (options.firstPlayer === 'coinFlip') {
        setCoinFlip({ playerDeck, opponentDeck, mode: m, stage: 'calling' });
        setStarting(false);
      } else {
        const firstPlayerOverride: Side = options.firstPlayer === 'player' ? 'player' : 'opponent';
        setState(createGame(playerDeck, opponentDeck, learningMode, options, firstPlayerOverride));
        setStarting(false);
      }
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start game.');
      setStarting(false);
    }
  }, [activeReleaseIds, learningMode, options, starting, updateOption]);

  const handleCoinCall = useCallback((call: 'heads' | 'tails') => {
    setCoinFlip(prev => prev ? { ...prev, stage: 'flipping', call } : prev);
    setTimeout(() => {
      const result: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
      const winner: Side = result === call ? 'player' : 'opponent';
      setCoinFlip(prev => prev ? { ...prev, stage: 'result', result, winner } : prev);
    }, 1200);
  }, []);

  const handleCoinStart = useCallback(() => {
    if (!coinFlip?.winner || !options) return;
    setState(createGame(coinFlip.playerDeck, coinFlip.opponentDeck, learningMode, options, coinFlip.winner));
    setCoinFlip(null);
  }, [coinFlip, learningMode, options]);

  // AI auto-play — paused while an event announcement is pending
  useEffect(() => {
    if (!state || mode !== 'ai' || state.turn !== 'opponent' || isGameOver(state) || aiEventPending) return;
    const timer = setTimeout(() => {
      // Auto-pass if AI has exhausted its allotted plays
      if (state.phase !== 'sudden_death' && state.opponent.playedCount >= state.options.maxPlays) {
        setState(s => s && passTurn(s));
        return;
      }
      const difficulty = state.options?.aiDifficulty ?? 'normal';
      const move = chooseAiMove(state, difficulty);
      if (!move) { setState(s => s && passTurn(s)); return; }
      const card = state.opponent.hand.find(c => c.id === move.cardId);
      if (!card) { setState(s => s && passTurn(s)); return; }
      let next: typeof state | null = null;
      if (card.type === 'creature') {
        next = playCreature(state, move.cardId, move.targetSide);
      } else if (card.type === 'item' || card.type === 'action') {
        if (move.targetCreatureId !== undefined) {
          next = playModifier(state, move.cardId, move.targetCreatureId, move.targetSide);
        }
      } else if (card.type === 'event' && move.targetCreatureId !== undefined) {
        next = playEvent(
          state, move.cardId,
          move.targetCreatureId, move.targetSide,
          move.secondTargetId, move.secondTargetSide
        );
        if (next) {
          setAiEventPending({ card, nextState: endTurn(next) });
          return;
        }
      }
      setState(next ? endTurn(next) : passTurn(state));
    }, 900);
    return () => clearTimeout(timer);
  }, [state, mode, aiEventPending]);

  const handleAiEventDismissed = useCallback(() => {
    if (!aiEventPending) return;
    setState(aiEventPending.nextState);
    setAiEventPending(null);
  }, [aiEventPending]);

  // Transition to sudden death when the regular game ends in a tie
  useEffect(() => {
    if (state && shouldEnterSuddenDeath(state)) {
      setState(enterSuddenDeath(state));
    }
  }, [state]);

  // Auto-pass in sudden death when the current player has no cards left.
  // The AI effect already handles the opponent's empty hand in AI mode.
  // In pass-and-play the player presses "Pass →" themselves so the HandoffScreen fires correctly.
  useEffect(() => {
    if (!state || state.phase !== 'sudden_death' || isGameOver(state)) return;
    if (state[state.turn].hand.length > 0) return;
    if (mode === 'pass-and-play') return;
    if (mode === 'ai' && state.turn === 'opponent') return;
    const timer = setTimeout(() => setState(s => s ? passTurn(s) : s), 400);
    return () => clearTimeout(timer);
  }, [state, mode]);

  if (loading || !options) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading...
      </div>
    );
  }

  const tooFew = activeReleaseIds.length < 2;

  if (!state) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 24px' }}>
        <h1 style={{ color: '#c9a84c', fontSize: '1.1em', margin: 0, fontFamily: "'Spectral', serif", letterSpacing: '0.08em', fontWeight: 700 }}>Choose Game Mode</h1>

        {/* Release selection accordion */}
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <button
            onClick={() => setReleasesOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', fontSize: '0.85em', padding: '4px 0',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: '0.75em' }}>{releasesOpen ? '▼' : '▶'}</span>
            Active Releases
            {!releasesOpen && <span style={{ color: '#555', fontWeight: 400 }}> · {activeReleaseIds.length} of {releases.length}</span>}
          </button>
          {releasesOpen && (
            <div style={{ marginTop: 8, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
              {/* Controls bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #181818' }}>
                <button onClick={() => setActiveIds(releases.map(r => r.id))} style={chipBtn}>All</button>
                <button onClick={() => setActiveIds([])} style={chipBtn}>None</button>
                <button
                  onClick={saveAsDefault}
                  style={{ ...chipBtn, color: savedDefault ? '#81c784' : '#888', transition: 'color 0.2s' }}
                >
                  {savedDefault ? 'Saved ✓' : 'Save'}
                </button>
                <span style={{ marginLeft: 'auto', color: '#3a3a3a', fontSize: '0.78em', fontFamily: 'monospace' }}>
                  {activeReleaseIds.length}/{releases.length}
                </span>
              </div>
              {/* Scrollable 3-column list with fade hint */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  maxHeight: 210, overflowY: 'auto',
                  display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: 1, padding: '6px 6px',
                }}>
                  {releases.map(r => {
                    const active = activeReleaseIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleRelease(r.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '5px 9px',
                          background: active ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
                          border: 'none', borderRadius: 5,
                          cursor: 'pointer', textAlign: 'left',
                          color: active ? '#d4ac5a' : '#555',
                          fontSize: '0.8em',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        <span style={{ fontSize: '1em', lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                        <span style={{ color: active ? '#c9a84c' : '#282828', fontSize: '0.85em', flexShrink: 0 }}>✓</span>
                      </button>
                    );
                  })}
                </div>
                {/* Scroll fade hint */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
                  background: 'linear-gradient(transparent, #0d0d0d)',
                  pointerEvents: 'none',
                }} />
              </div>
              {(tooFew || startError) && (
                <p style={{ color: '#ef5350', fontSize: '0.8em', margin: 0, padding: '6px 12px 8px', borderTop: '1px solid #181818' }}>
                  {startError ?? 'Select at least 2 releases to play.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Game Options accordion */}
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <button
            onClick={() => setOptionsOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', fontSize: '0.85em', padding: '4px 0',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: '0.75em' }}>{optionsOpen ? '▼' : '▶'}</span>
            Game Options
            {!optionsOpen && (() => { const s = nonDefaultSummary(options); return s ? <span style={{ color: '#555', fontWeight: 400 }}> · {s}</span> : null; })()}
          </button>
          {optionsOpen && (
            <div style={{
              marginTop: 10, padding: '16px 20px',
              background: '#0d0d0d', border: '1px solid #222', borderRadius: 10,
            }}>
              <SegControl
                label="Hand Size"
                options={[3, 4, 5, 6] as number[]}
                value={options.handSize}
                onChange={v => updateOption('handSize', v)}
                isMobile={isMobile}
              />
              <SegControl
                label="Aside Cards"
                options={[1, 2, 3, 4, 5] as number[]}
                value={options.setAsideCount}
                onChange={v => updateOption('setAsideCount', v)}
                isMobile={isMobile}
              />
              <SegControl
                label="Event Cards"
                options={[0, 1, 2] as number[]}
                value={options.eventCount}
                onChange={v => updateOption('eventCount', v)}
                isMobile={isMobile}
              />
              <Stepper
                label="Max Plays"
                value={options.maxPlays}
                min={12}
                max={30}
                onChange={v => updateOption('maxPlays', v)}
                isMobile={isMobile}
              />
              <ToggleRow
                label="Guaranteed Event"
                value={options.guaranteedEvent}
                onChange={v => updateOption('guaranteedEvent', v)}
                disabled={options.eventCount === 0}
                isMobile={isMobile}
              />
              <SegControl
                label="First Player"
                options={['coinFlip', 'player', 'opponent'] as GameOptions['firstPlayer'][]}
                labels={['Coin Flip', 'Player 1', 'Player 2']}
                value={options.firstPlayer}
                onChange={v => updateOption('firstPlayer', v)}
                isMobile={isMobile}
              />
              <SegControl
                label="AI Difficulty"
                options={['easy', 'normal', 'hard', 'expert'] as GameOptions['aiDifficulty'][]}
                labels={['Easy', 'Normal', 'Hard', 'Expert']}
                value={options.aiDifficulty}
                onChange={v => updateOption('aiDifficulty', v)}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>

        {/* Custom Deck selector (logged-in users only) */}
        {isSignedIn && userDecks.length > 0 && (
          <div style={{ width: '100%', maxWidth: 1200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: options.customDeckId ? 8 : 0, flexWrap: 'wrap' }}>
              <span style={{ color: '#aaa', fontSize: '0.82em', width: isMobile ? 90 : 148, flexShrink: 0 }}>Custom Deck</span>
              <select
                value={options.customDeckId ?? ''}
                onChange={e => updateOption('customDeckId', e.target.value || null)}
                style={{
                  background: '#111', color: options.customDeckId ? '#ddd' : '#555',
                  border: '1px solid #2a2a2a', borderRadius: 6,
                  padding: '4px 8px', fontSize: '0.8em',
                  cursor: 'pointer', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  maxWidth: 220,
                }}
              >
                <option value="">— Auto-balanced —</option>
                {userDecks.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.card_ids.length} cards)</option>
                ))}
              </select>
              {options.customDeckId && (
                <span style={{ color: '#555', fontSize: '0.72em' }}>You play this deck; opponent uses auto-balanced</span>
              )}
            </div>
          </div>
        )}
        {isSignedIn && userDecks.length === 0 && (
          <div style={{ color: '#2a2a2a', fontSize: '0.78em' }}>
            <a href="/decks/new" style={{ color: '#3a3a6a', textDecoration: 'underline' }}>Build a custom deck</a> to use it here
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#aaa', fontSize: '0.95em' }}>
          <input
            type="checkbox"
            checked={learningMode}
            onChange={e => setLearningMode(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          🧮 Learning Mode (answer math questions when playing modifiers)
        </label>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => startGame('ai')}
            disabled={tooFew || starting}
            style={{
              background: tooFew || starting ? '#111' : '#1a237e',
              color: tooFew || starting ? '#444' : '#fff',
              border: `2px solid ${tooFew || starting ? '#333' : '#5c6bc0'}`,
              borderRadius: 10, padding: isMobile ? '12px 24px' : '14px 32px', fontSize: '1.1em',
              cursor: tooFew || starting ? 'not-allowed' : 'pointer',
              flex: isMobile ? '1 1 140px' : 'none',
            }}
          >
            {starting ? '...' : '⚔ vs AI'}
          </button>
          <button
            onClick={() => !tooFew && !starting && setNameInputPending(true)}
            disabled={tooFew || starting}
            style={{
              background: tooFew || starting ? '#111' : '#1b5e20',
              color: tooFew || starting ? '#444' : '#fff',
              border: `2px solid ${tooFew || starting ? '#333' : '#81c784'}`,
              borderRadius: 10, padding: isMobile ? '12px 24px' : '14px 32px', fontSize: '1.1em',
              cursor: tooFew || starting ? 'not-allowed' : 'pointer',
              flex: isMobile ? '1 1 140px' : 'none',
            }}
          >
            {starting ? '...' : '👥 Pass & Play'}
          </button>
        </div>

        <button
          onClick={() => setState(null)}
          style={{ background: 'none', color: '#555', border: 'none', cursor: 'pointer', fontSize: '0.9em', marginTop: 8 }}
        >
          ← Back
        </button>

        {nameInputPending && (
          <NameInputModal
            onConfirm={(player, opponent) => {
              setPlayerNames({ player, opponent });
              setNameInputPending(false);
              startGame('pass-and-play');
            }}
          />
        )}

        {coinFlip && (
          <CoinFlipModal flip={coinFlip} playerNames={playerNames} onCall={handleCoinCall} onStart={handleCoinStart} />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '4px 6px' : '6px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#444', fontSize: '0.55em', letterSpacing: '0.05em' }}>
          {mode === 'ai' ? (
            <>
              ⚔ vs AI
              {state.options.aiDifficulty !== 'normal' && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px', borderRadius: 4,
                  background: state.options.aiDifficulty === 'expert' ? '#1a0d0d'
                    : state.options.aiDifficulty === 'hard' ? '#0d1a0d'
                    : '#1a1a0d',
                  color: state.options.aiDifficulty === 'expert' ? '#ef9a9a'
                    : state.options.aiDifficulty === 'hard' ? '#a5d6a7'
                    : '#fff59d',
                  border: '1px solid currentColor',
                  fontSize: '0.9em',
                }}>
                  {state.options.aiDifficulty === 'expert' ? 'Expert'
                    : state.options.aiDifficulty === 'hard' ? 'Hard'
                    : 'Easy'}
                </span>
              )}
            </>
          ) : '👥 Pass & Play'}
        </span>
        <button
          onClick={() => setState({ ...state, learningMode: !state.learningMode })}
          style={{
            background: state.learningMode ? 'rgba(27,94,32,0.3)' : 'transparent',
            color: state.learningMode ? '#a5d6a7' : '#444',
            border: `1px solid ${state.learningMode ? 'rgba(102,187,106,0.3)' : '#2a2a2a'}`,
            borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.55em',
          }}
        >
          🧮 Learning Mode {state.learningMode ? 'ON' : 'OFF'}
        </button>
      </div>
      <GameBoard
        state={state}
        onStateChange={setState}
        mode={mode}
        onNewGame={(ls) => {
          if (ls && ls.total > 0) {
            fetch('/api/learning/stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                totalAttempted:  ls.total,
                totalCorrect:    ls.correct,
                itemAttempted:   ls.item.total,
                itemCorrect:     ls.item.correct,
                actionAttempted: ls.action.total,
                actionCorrect:   ls.action.correct,
              }),
            }).catch(console.error);
          }
          setState(null);
        }}
        playerNames={mode === 'pass-and-play' ? playerNames : undefined}
        aiEventAnnouncement={aiEventPending ? { card: aiEventPending.card, playedBy: 'opponent' } : null}
        onAiEventDismissed={handleAiEventDismissed}
      />
    </div>
  );
}

function nonDefaultSummary(opts: GameOptions): string {
  const d = DEFAULT_OPTIONS;
  const parts: string[] = [];
  if (opts.handSize !== d.handSize) parts.push(`Hand ${opts.handSize}`);
  if (opts.setAsideCount !== d.setAsideCount) parts.push(`Aside ${opts.setAsideCount}`);
  if (opts.eventCount !== d.eventCount) parts.push(`Events ${opts.eventCount}`);
  if (opts.maxPlays !== d.maxPlays) parts.push(`Max ${opts.maxPlays}`);
  if (opts.guaranteedEvent !== d.guaranteedEvent) parts.push('No Guar. Event');
  if (opts.firstPlayer !== d.firstPlayer) parts.push(opts.firstPlayer === 'player' ? 'P1 First' : 'P2 First');
  if (opts.aiDifficulty !== d.aiDifficulty) {
    const labels: Record<typeof opts.aiDifficulty, string> = { easy: 'Easy AI', normal: 'Normal AI', hard: 'Hard AI', expert: 'Expert AI' };
    parts.push(labels[opts.aiDifficulty]);
  }
  if (opts.customDeckId) parts.push('Custom Deck');
  return parts.join(' · ');
}

const chipBtn: React.CSSProperties = {
  background: '#222', color: '#aaa', border: '1px solid #333',
  borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontSize: '0.8em',
};
