'use client';
import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { fetchCardsByReleaseIds, fetchReleases } from '@/lib/supabase';
import { buildBalancedDecks } from '@/lib/deck';
import { createGame, computeScore } from '@/lib/GameEngine';
import GameBoardV2 from '@/components/GameBoardV2';
import { getChapterById, type CampaignChapter } from '@/lib/campaign';
import type { GameState, GameOptions } from '@/lib/types';

type Phase = 'loading' | 'intro' | 'playing' | 'result' | 'error';

interface CampaignResult {
  chapterPassed: boolean;
  winner: 'player' | 'opponent' | 'tie';
  playerScore: number;
  opponentScore: number;
  xpAwarded: number;
  arcCompleted: boolean;
  badgeEmoji: string | null;
  badgeName: string | null;
}

const DEFAULT_OPTIONS: GameOptions = {
  handSize: 5, guaranteedEvent: true, maxPlays: 3, eventCount: 2,
  firstPlayer: 'player', setAsideCount: 4, aiDifficulty: 'normal', customDeckId: null,
};

export default function CampaignChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId: chapterIdStr } = use(params);
  const chapterId = parseInt(chapterIdStr, 10);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [chapter, setChapter] = useState<CampaignChapter | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [starting, setStarting] = useState(false);
  const resultCalled = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { window.location.href = '/login'; return; }
      const ch = await getChapterById(chapterId);
      if (!mounted) return;
      if (!ch) { setPhase('error'); return; }
      setChapter(ch);
      setPhase('intro');
    }).catch(() => { if (mounted) setPhase('error'); });
    return () => { mounted = false; };
  }, [chapterId]);

  const startBattle = useCallback(async () => {
    if (!chapter || starting) return;
    setStarting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const releases = await fetchReleases(supabase);
      const releaseIds = releases.slice(0, 2).map((r: { id: number }) => r.id);
      const pool = await fetchCardsByReleaseIds(releaseIds, supabase);
      const { playerDeck, opponentDeck } = buildBalancedDecks(pool, { eventCount: DEFAULT_OPTIONS.eventCount });
      const options: GameOptions = { ...DEFAULT_OPTIONS, aiDifficulty: chapter.ai_difficulty };
      const gs = createGame(playerDeck, opponentDeck, false, options, 'player');
      setGameState(gs);
      setPhase('playing');
    } catch (err) {
      console.error('[campaign] failed to start battle:', err);
      setPhase('error');
    } finally {
      setStarting(false);
    }
  }, [chapter, starting]);

  // GameBoardV2 calls onNewGame when game ends and player clicks the game-over button.
  // We repurpose this to transition to campaign result phase.
  const handleGameEnd = useCallback(async () => {
    if (!gameStateRef.current || !chapter || resultCalled.current) return;
    resultCalled.current = true;

    const winner = (gameStateRef.current?.winner ?? 'tie') as 'player' | 'opponent' | 'tie';
    const playerScore = computeScore(gameStateRef.current?.player.field ?? []);
    const opponentScore = computeScore(gameStateRef.current?.opponent.field ?? []);

    try {
      const r = await fetch('/api/campaign/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, winner, playerScore, opponentScore }),
      });
      const data = await r.json() as {
        chapter_passed?: boolean;
        xp_awarded?: number;
        arc_completed?: boolean;
        badge_emoji?: string | null;
        badge_name?: string | null;
      };
      setResult({
        chapterPassed: data.chapter_passed ?? false,
        winner, playerScore, opponentScore,
        xpAwarded: data.xp_awarded ?? 0,
        arcCompleted: data.arc_completed ?? false,
        badgeEmoji: data.badge_emoji ?? null,
        badgeName: data.badge_name ?? null,
      });
    } catch {
      setResult({ chapterPassed: false, winner, playerScore, opponentScore, xpAwarded: 0, arcCompleted: false, badgeEmoji: null, badgeName: null });
    }
    setPhase('result');
  }, [chapter]);

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading chapter…
      </div>
    );
  }

  if (phase === 'error' || !chapter) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350' }}>
        Chapter not found.
        <button onClick={() => router.push('/campaign')} style={{ background: 'none', border: 'none', color: '#5c6bc0', cursor: 'pointer', marginLeft: 8 }}>
          Back to Campaign
        </button>
      </div>
    );
  }

  if (phase === 'intro') {
    const diffColor: Record<string, string> = {
      easy: '#a5d6a7', normal: '#ffd54f', hard: '#ef9a9a', expert: '#ce93d8'
    };
    return (
      <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
        <div style={{ color: '#ffd54f', fontSize: '0.7em', letterSpacing: 2, marginBottom: 8 }}>CAMPAIGN CHAPTER</div>
        <h1 style={{ color: '#fff', fontSize: '1.7em', margin: '0 0 8px' }}>{chapter.title}</h1>
        <div style={{ color: '#555', fontSize: '0.78em', marginBottom: 24 }}>
          vs <span style={{ color: '#aaa' }}>{chapter.ai_opponent_name}</span>
          {' · '}
          <span style={{ color: diffColor[chapter.ai_difficulty] }}>
            {chapter.ai_difficulty.charAt(0).toUpperCase() + chapter.ai_difficulty.slice(1)}
          </span>
          {chapter.win_condition === 'win_by_margin' && (
            <span style={{ color: '#888' }}> · win by {chapter.win_param}+ points</span>
          )}
        </div>
        <div style={{
          background: '#0a0a0a', border: '1px solid #1e1e1e',
          borderRadius: 16, padding: '24px 20px', marginBottom: 28,
          color: '#aaa', fontSize: '0.88em', fontFamily: 'sans-serif',
          lineHeight: 1.7, textAlign: 'left',
        }}>
          {chapter.narrative_intro}
        </div>
        <div style={{ color: '#555', fontSize: '0.72em', marginBottom: 16 }}>
          Victory reward: <span style={{ color: '#ffd54f' }}>+{chapter.xp_reward} XP</span>
        </div>
        <button
          onClick={startBattle}
          disabled={starting}
          style={{
            background: '#5c6bc0', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px 40px',
            fontFamily: "'Cinzel', serif", fontSize: '1em', fontWeight: 700,
            cursor: starting ? 'not-allowed' : 'pointer', letterSpacing: 1,
          }}
        >
          {starting ? 'Preparing…' : '⚔️ Start Battle'}
        </button>
      </div>
    );
  }

  if (phase === 'playing' && gameState) {
    return (
      <GameBoardV2
        state={gameState}
        onStateChange={setGameState}
        mode="ai"
        onNewGame={handleGameEnd}
        playerNames={{ player: 'You', opponent: chapter.ai_opponent_name }}
      />
    );
  }

  if (phase === 'result' && result && chapter) {
    const outro = result.winner === 'player' ? chapter.narrative_outro_win : chapter.narrative_outro_loss;
    const passColor = result.chapterPassed ? '#a5d6a7' : '#ef9a9a';
    const passBg = result.chapterPassed ? '#0a2e0a' : '#2e0a0a';
    return (
      <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
        <div style={{ fontSize: '3em', marginBottom: 12 }}>
          {result.chapterPassed ? '🏆' : '💀'}
        </div>
        <h1 style={{ color: passColor, fontSize: '1.6em', margin: '0 0 8px' }}>
          {result.chapterPassed ? 'Victory!' : 'Defeat'}
        </h1>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a5d6a7', fontSize: '0.7em', marginBottom: 2 }}>YOU</div>
            <div style={{ color: '#fff', fontSize: '2em', fontWeight: 700 }}>{result.playerScore}</div>
          </div>
          <div style={{ color: '#333', alignSelf: 'center', fontSize: '1.2em' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ef9a9a', fontSize: '0.7em', marginBottom: 2 }}>OPPONENT</div>
            <div style={{ color: '#fff', fontSize: '2em', fontWeight: 700 }}>{result.opponentScore}</div>
          </div>
        </div>

        <div style={{
          background: passBg, border: `1px solid ${passColor}44`,
          borderRadius: 16, padding: '20px 16px', marginBottom: 20,
          color: '#aaa', fontSize: '0.85em', fontFamily: 'sans-serif', lineHeight: 1.6, textAlign: 'left',
        }}>
          {outro}
        </div>

        {result.xpAwarded > 0 && (
          <div style={{ color: '#ffd54f', fontSize: '1em', fontWeight: 700, marginBottom: 12 }}>
            +{result.xpAwarded} XP earned
          </div>
        )}

        {result.arcCompleted && result.badgeEmoji && (
          <div style={{
            background: '#1a1200', border: '1px solid #ffd54f44',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            color: '#ffd54f', fontSize: '0.85em',
          }}>
            {result.badgeEmoji} Arc complete — <strong>{result.badgeName}</strong> badge earned!
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!result.chapterPassed && (
            <button
              onClick={() => { resultCalled.current = false; setPhase('intro'); setGameState(null); setResult(null); }}
              style={{
                background: '#5c6bc0', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 28px',
                fontFamily: "'Cinzel', serif", fontSize: '0.9em', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => router.push('/campaign')}
            style={{
              background: result.chapterPassed ? '#5c6bc0' : '#111',
              color: result.chapterPassed ? '#fff' : '#aaa',
              border: result.chapterPassed ? 'none' : '1px solid #222',
              borderRadius: 10, padding: '12px 28px',
              fontFamily: "'Cinzel', serif", fontSize: '0.9em',
              fontWeight: result.chapterPassed ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            Campaign Map
          </button>
        </div>
      </div>
    );
  }

  return null;
}
