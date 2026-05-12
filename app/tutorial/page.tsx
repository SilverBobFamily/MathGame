'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { playCreature, playModifier, playEvent, passTurn } from '@/lib/GameEngine';
import { chooseAiMove } from '@/lib/ai';
import { getPlayedCardType } from '@/lib/tutorialSteps';
import GameBoard from '@/components/GameBoardV2';
import type { GameState, Card, GameOptions } from '@/lib/types';

// ── Tutorial steps ──────────────────────────────────────────────────────────

type TutorialStep =
  | 'intro'
  | 'play-creature'
  | 'ai-plays-1'
  | 'play-item'
  | 'ai-plays-2'
  | 'play-action'
  | 'ai-plays-3'
  | 'play-event'
  | 'complete'
  | 'claiming';

const STEP_MESSAGES: Record<TutorialStep, string> = {
  'intro':        'Welcome to Mathemagic! Learn the 4 card types. Click "Start Tutorial" to begin.',
  'play-creature':'🐉 Creature — Click a Creature card from your hand, then click a zone on your side of the field to play it.',
  'ai-plays-1':  'Your opponent is taking their turn…',
  'play-item':   '⚔️ Item — Click your Item card, then click your Creature to boost its value.',
  'ai-plays-2':  'Your opponent responds…',
  'play-action': '✖️ Action — Click your Action card, then click your Creature to multiply its value.',
  'ai-plays-3':  'Your opponent takes a turn…',
  'play-event':  '⚡ Event — Click your Event card to play it (Events affect the whole board).',
  'complete':    '🎓 Tutorial Complete!',
  'claiming':    '🎓 Claiming your reward…',
};

const AI_STEP_NEXT: Partial<Record<TutorialStep, TutorialStep>> = {
  'ai-plays-1': 'play-item',
  'ai-plays-2': 'play-action',
  'ai-plays-3': 'play-event',
};

const TUTORIAL_OPTIONS: GameOptions = {
  handSize: 4,
  guaranteedEvent: false,
  maxPlays: 4,
  eventCount: 0,
  firstPlayer: 'player',
  setAsideCount: 0,
  aiDifficulty: 'easy',
  customDeckId: null,
};

// ── Component ───────────────────────────────────────────────────────────────

export default function TutorialPage() {
  const [loading, setLoading] = useState(true);
  const [alreadyGraduated, setAlreadyGraduated] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('intro');
  const [claimError, setClaimError] = useState<string | null>(null);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mount: auth + fetch cards ─────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();

      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Check tutorial_completed
      const { data: player } = await supabase
        .from('players')
        .select('tutorial_completed')
        .eq('id', user.id)
        .single();

      if (player?.tutorial_completed) {
        setAlreadyGraduated(true);
        setLoading(false);
        return;
      }

      // Fetch one card of each type
      const fetchOne = async (type: string): Promise<Card | null> => {
        const { data } = await supabase
          .from('cards')
          .select('*')
          .eq('type', type)
          .order('id')
          .limit(1)
          .single();
        return data as Card | null;
      };

      const [creature, item, action, event] = await Promise.all([
        fetchOne('creature'),
        fetchOne('item'),
        fetchOne('action'),
        fetchOne('event'),
      ]);

      if (!creature || !item || !action || !event) {
        // Not enough cards to run tutorial
        setLoading(false);
        return;
      }

      // Fetch AI hand: 4 creatures that are NOT the player's creature card
      const { data: aiCards } = await supabase
        .from('cards')
        .select('*')
        .eq('type', 'creature')
        .neq('id', creature.id)
        .order('id')
        .limit(4);

      const aiHand: Card[] = (aiCards ?? []) as Card[];

      // Build initial GameState directly (no createGame)
      const initialState: GameState = {
        phase: 'playing',
        turn: 'player',
        firstTurn: 'player',
        round: 1,
        winner: null,
        pendingCard: null,
        learningMode: false,
        options: TUTORIAL_OPTIONS,
        player: {
          hand: [creature, item, action, event],
          deck: [],
          field: [],
          aside: [],
          playedCount: 0,
        },
        opponent: {
          hand: aiHand,
          deck: [],
          field: [],
          aside: [],
          playedCount: 0,
        },
      };

      setGameState(initialState);
      setLoading(false);
    })();
  }, []);

  // ── AI auto-play effect ───────────────────────────────────────────────────

  useEffect(() => {
    // Clear any pending timer when step changes
    if (aiTimerRef.current !== null) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    const isAiStep = tutorialStep === 'ai-plays-1' || tutorialStep === 'ai-plays-2' || tutorialStep === 'ai-plays-3';
    if (!isAiStep || !gameState || gameState.turn !== 'opponent') return;

    const nextStep = AI_STEP_NEXT[tutorialStep]!;

    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      setGameState(prev => {
        if (!prev) return prev;
        const move = chooseAiMove(prev, 'easy');
        if (!move) {
          return passTurn(prev);
        }
        let next: GameState;
        if (prev.opponent.hand.find(c => c.id === move.cardId)?.type === 'creature') {
          next = playCreature(prev, move.cardId, move.targetSide);
        } else if (move.targetCreatureId !== undefined) {
          next = playModifier(prev, move.cardId, move.targetCreatureId, move.targetSide);
        } else {
          next = prev; // skip
        }
        return passTurn(next);
      });
      setTutorialStep(nextStep);
    }, 1200);

    return () => {
      if (aiTimerRef.current !== null) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialStep, gameState?.turn]);

  // ── Handle state changes from GameBoardV2 ────────────────────────────────

  const handleStateChange = useCallback((next: GameState) => {
    setGameState(prev => {
      if (!prev) return next;
      const playedType = getPlayedCardType(prev, next);
      if (playedType) {
        // Determine the next tutorial step
        setTutorialStep(current => {
          if (current === 'play-creature' && playedType === 'creature') return 'ai-plays-1';
          if (current === 'play-item'    && playedType === 'item')     return 'ai-plays-2';
          if (current === 'play-action'  && playedType === 'action')   return 'ai-plays-3';
          if (current === 'play-event'   && playedType === 'event')    return 'complete';
          return current;
        });
      }
      return next;
    });
  }, []);

  // ── Claim handler ─────────────────────────────────────────────────────────

  const handleClaim = async () => {
    setTutorialStep('claiming');
    setClaimError(null);
    try {
      const res = await fetch('/api/tutorial/complete', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 200) {
        setClaimError((json as { error?: string }).error ?? 'Something went wrong.');
        setTutorialStep('complete');
        return;
      }
      window.location.href = '/profile';
    } catch {
      setClaimError('Network error. Please try again.');
      setTutorialStep('complete');
    }
  };

  // ── Start tutorial ────────────────────────────────────────────────────────

  const handleStart = () => {
    setTutorialStep('play-creature');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#aaa', fontSize: '1.1em' }}>
        Loading tutorial…
      </div>
    );
  }

  if (alreadyGraduated) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 24, textAlign: 'center', padding: '0 24px',
      }}>
        <div style={{ fontSize: '4rem' }}>🎓</div>
        <h1 style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', fontSize: '2rem', margin: 0 }}>Already Graduated</h1>
        <p style={{ color: '#aaa', maxWidth: 400 }}>
          You have already completed the tutorial. Head back to the game to keep playing!
        </p>
        <a href="/game" style={{
          background: '#5c6bc0', color: '#fff', padding: '12px 28px',
          borderRadius: 8, textDecoration: 'none', fontFamily: "'Cinzel', serif",
          fontSize: '1rem', fontWeight: 700,
        }}>
          Play Now
        </a>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#f44' }}>
        Could not load tutorial cards. Please try again later.
      </div>
    );
  }

  const isCompleteStep = tutorialStep === 'complete' || tutorialStep === 'claiming';
  const bannerMessage = STEP_MESSAGES[tutorialStep];

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Game board */}
      <GameBoard
        state={gameState}
        onStateChange={handleStateChange}
        mode="ai"
        onNewGame={() => { window.location.reload(); }}
        playerNames={{ player: 'You', opponent: 'Tutor' }}
      />

      {/* Instruction banner */}
      {!isCompleteStep && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'rgba(10, 10, 30, 0.93)',
          border: '1px solid #5c6bc0',
          borderRadius: 12,
          padding: '14px 24px',
          maxWidth: 480,
          width: 'calc(100vw - 48px)',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: '#e0e0e0', fontSize: '0.95rem', lineHeight: 1.5, fontFamily: "'Noto Serif', serif" }}>
            {bannerMessage}
          </span>
          {tutorialStep === 'intro' && (
            <button
              onClick={handleStart}
              style={{
                background: '#5c6bc0',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontSize: '0.95rem',
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Start Tutorial
            </button>
          )}
        </div>
      )}

      {/* Full-screen overlay for complete/claiming */}
      {isCompleteStep && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(5, 5, 20, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          textAlign: 'center',
          padding: '0 24px',
        }}>
          <div style={{ fontSize: '5rem' }}>🎓</div>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            color: '#c9a84c',
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            margin: 0,
          }}>
            Tutorial Complete!
          </h1>
          <p style={{ color: '#aaa', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
            You have learned all 4 card types. Claim your Graduate badge and start playing for real!
          </p>
          {claimError && (
            <p style={{ color: '#f66', fontSize: '0.9rem', margin: 0 }}>{claimError}</p>
          )}
          <button
            onClick={handleClaim}
            disabled={tutorialStep === 'claiming'}
            style={{
              background: tutorialStep === 'claiming' ? '#333' : '#c9a84c',
              color: tutorialStep === 'claiming' ? '#666' : '#0a0a1a',
              border: 'none',
              borderRadius: 10,
              padding: '14px 36px',
              fontSize: '1.05rem',
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              cursor: tutorialStep === 'claiming' ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {tutorialStep === 'claiming' ? 'Claiming…' : 'Claim Graduate Badge'}
          </button>
        </div>
      )}
    </div>
  );
}
