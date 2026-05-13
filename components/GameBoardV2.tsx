'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useWindowWidth } from '@/hooks/useWindowWidth';
import type { GameState, Card, FieldCard as FieldCardType, Side } from '@/lib/types';
import {
  computeScore, computeCardValue,
  playCreature, playModifier, playEvent,
  endTurn, passTurn, isGameOver, getWinner,
} from '@/lib/GameEngine';
import CardModal from './CardModal';
import LearningModePrompt from './LearningModePrompt';
import GameOverScreen from './GameOverScreen';
import EventAnnouncement from './EventAnnouncement';
import HandoffScreen from './HandoffScreen';

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD   = '#c9a84c';
const DISPLAY = "'Spectral', serif";
const MONO   = "'DM Sans', sans-serif";
const SERIF  = "'DM Sans', sans-serif";

// Crimson = opponent / top zone
const OPP = {
  zoneBg:    'linear-gradient(180deg, #1a0808 0%, #120606 100%)',
  zoneGlow:  'radial-gradient(ellipse at 50% 0%, rgba(120,20,20,0.4) 0%, transparent 70%)',
  label:     '#b04040',
  fieldBg:   'rgba(180,40,40,0.05)',
  fieldBdr:  'rgba(180,40,40,0.15)',
  cardBdr:   '#6a2020',
  cardBg:    '#1a0404',
  valColor:  '#c06060',
  valWin:    '#ff8080',
  badgeBg:   '#2a0808',
  badgeBdr:  '#7a1a1a',
  badgeWin:  '#ef5350',
  badgeTxt:  '#e87070',
  badgeWTxt: '#ff8080',
  badgeGlow: 'rgba(239,83,80,0.35)',
  deckBg:    '#1a0606',
  deckBdr:   '#4a1010',
  deckTxt:   '#6a2020',
  handBg:    'linear-gradient(135deg, #2a0a0a, #1a0606)',
  handBdr:   '#4a1010',
};

// Navy = player / bottom zone
const PLR = {
  zoneBg:    'linear-gradient(180deg, #060a18 0%, #080c1e 100%)',
  zoneGlow:  'radial-gradient(ellipse at 50% 100%, rgba(20,40,140,0.4) 0%, transparent 70%)',
  label:     '#4060b0',
  fieldBg:   'rgba(40,60,200,0.05)',
  fieldBdr:  'rgba(60,80,200,0.15)',
  cardBdr:   '#1a2a7a',
  cardBg:    '#04060e',
  valColor:  '#6090c0',
  valWin:    '#90caf9',
  badgeBg:   '#080e2a',
  badgeBdr:  '#1a2a7a',
  badgeWin:  '#5c6bc0',
  badgeTxt:  '#6090e8',
  badgeWTxt: '#90caf9',
  badgeGlow: 'rgba(92,107,192,0.4)',
  deckBg:    '#060a1a',
  deckBdr:   '#101a4a',
  deckTxt:   '#202060',
  handBg:    'linear-gradient(135deg, #080e2a, #060a18)',
  handBdr:   '#1a2a7a',
};

// Card type border overrides
const TYPE_BDR: Record<string, string> = {
  item:   '#2e7d32',
  action: '#6a1b9a',
  event:  '#7f0000',
};
const TYPE_BG: Record<string, string> = {
  item:   '#071a09',
  action: '#1a0533',
  event:  '#1a0000',
};
const TYPE_VAL: Record<string, string> = {
  creature: '#90caf9',
  item:     '#a5d6a7',
  action:   '#ce93d8',
  event:    '#ef9a9a',
};

// ── Score badge ────────────────────────────────────────────────────────────
function ScoreBadge({ score, winning, theme, small }: {
  score: number; winning: boolean; theme: typeof OPP | typeof PLR; small?: boolean;
}) {
  return (
    <div style={{
      fontFamily: DISPLAY, fontWeight: 900, fontSize: small ? '22px' : '34px',
      background: theme.badgeBg,
      border: `2px solid ${winning ? theme.badgeWin : theme.badgeBdr}`,
      borderRadius: 10,
      padding: small ? '3px 12px' : '4px 20px',
      color: winning ? theme.badgeWTxt : theme.badgeTxt,
      boxShadow: winning ? `0 0 20px ${theme.badgeGlow}` : 'none',
      flexShrink: 0,
      lineHeight: 1,
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}>
      {score}
    </div>
  );
}

// ── Deck pill ──────────────────────────────────────────────────────────────
function DeckPill({ count, theme }: { count: number; theme: typeof OPP | typeof PLR }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: theme.deckBg, border: `1px solid ${theme.deckBdr}`,
      borderRadius: 20, padding: '3px 9px',
      fontFamily: DISPLAY, fontSize: '13px', letterSpacing: '0.04em',
      color: theme.deckTxt, flexShrink: 0,
    }}>
      <div style={{
        width: 8, height: 11, borderRadius: 2,
        background: theme.deckBdr, border: `1px solid ${theme.deckTxt}`,
        flexShrink: 0,
      }} />
      {count} left
    </div>
  );
}

// ── Opponent face-down hand card ───────────────────────────────────────────
function OppHandCard() {
  return (
    <div style={{
      width: 46, height: 64, borderRadius: 6, marginRight: -14,
      background: OPP.handBg, border: `2px solid ${OPP.handBdr}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#2a0808', fontSize: '20px', flexShrink: 0,
    }}>
      🂠
    </div>
  );
}

// ── Field card (portrait) ──────────────────────────────────────────────────
function FieldCardV2({ fc, onClick, highlighted, isFirstTarget, flashCard, theme }: {
  fc: FieldCardType;
  onClick: () => void;
  highlighted?: boolean;
  isFirstTarget?: boolean;
  flashCard?: Card | null;
  theme: typeof OPP | typeof PLR;
}) {
  const total = computeCardValue(fc);
  const hasModifiers = fc.modifiers.length > 0 || fc.zeroed || fc.squared;
  const cardBdr = TYPE_BDR[fc.card.type] ?? theme.cardBdr;

  const activeBdr = highlighted ? GOLD : isFirstTarget ? '#ce93d8' : cardBdr;
  const glow = highlighted
    ? `0 0 0 2px ${GOLD}, 0 0 20px rgba(201,168,76,0.4)`
    : isFirstTarget
    ? '0 0 0 2px #ce93d8, 0 0 16px rgba(206,147,216,0.4)'
    : '0 3px 10px rgba(0,0,0,0.5)';

  // Modifier pip info
  const firstMod = fc.modifiers[0];
  let pipLabel = '';
  let pipBg = '#2e7d32';
  let pipColor = '#a5d6a7';
  if (fc.zeroed)     { pipLabel = '→0'; pipBg = '#7f0000'; pipColor = '#ef9a9a'; }
  else if (fc.squared) { pipLabel = 'x²'; pipBg = '#c8960c'; pipColor = '#fff8e1'; }
  else if (firstMod) {
    pipLabel = `${firstMod.card.operator ?? ''}${firstMod.card.operator_value ?? ''}`;
    if (fc.modifiers.length > 1) pipLabel += ` +${fc.modifiers.length - 1}`;
    pipBg = firstMod.card.type === 'action' ? '#4a148c' : '#2e7d32';
    pipColor = firstMod.card.type === 'action' ? '#ce93d8' : '#a5d6a7';
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: 140, height: 220, borderRadius: 8, overflow: 'hidden',
        border: `2px solid ${activeBdr}`,
        background: theme.cardBg,
        boxShadow: glow,
        cursor: 'pointer', flexShrink: 0,
        transition: 'transform 0.15s, box-shadow 0.2s',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Art — 55% of 220px = 121px */}
      <div style={{
        height: 121, position: 'relative', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {fc.card.art_url
          ? <img src={fc.card.art_url} alt={fc.card.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '2.4em', position: 'relative', zIndex: 1 }}>{fc.card.art_emoji}</span>
        }
        {hasModifiers && (
          <div style={{
            position: 'absolute', top: 4, right: 4, zIndex: 2,
            background: pipBg, color: pipColor,
            borderRadius: 4, padding: '2px 6px',
            fontSize: '10px', fontFamily: DISPLAY, fontWeight: 700,
            lineHeight: 1,
          }}>
            {pipLabel}
          </div>
        )}
      </div>

      {/* Value panel — 45% of 220px = 99px */}
      <div style={{
        flex: 1, background: '#08080f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 6,
        padding: '8px 6px',
      }}>
        <div style={{
          fontFamily: DISPLAY, fontWeight: 900, fontSize: '36px', lineHeight: 1,
          color: hasModifiers ? GOLD : (TYPE_VAL[fc.card.type] ?? theme.valColor),
          textShadow: hasModifiers
            ? '0 0 12px rgba(201,168,76,0.8)'
            : `0 0 10px ${(TYPE_VAL[fc.card.type] ?? theme.valColor)}88`,
        }}>
          {total}
        </div>
        <div style={{
          width: '100%', textAlign: 'center',
          fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.1em',
          color: TYPE_VAL[fc.card.type] ?? theme.valColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          opacity: 0.75,
        }}>
          {fc.card.name}
        </div>
      </div>

      {/* Modifier flash */}
      {flashCard && (
        <div style={{
          position: 'absolute', top: -26, left: 0, right: 0,
          textAlign: 'center', pointerEvents: 'none',
          background: flashCard.type === 'action' ? '#4a148c' : '#1b5e20',
          color: flashCard.type === 'action' ? '#ce93d8' : '#a5d6a7',
          fontSize: '8px', fontWeight: 700, padding: '2px 4px', borderRadius: 4,
          fontFamily: DISPLAY,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {flashCard.operator}{flashCard.operator_value !== undefined ? flashCard.operator_value : ''} {flashCard.name}
        </div>
      )}
    </div>
  );
}

// ── Hand card (portrait, fanned) ───────────────────────────────────────────
function HandCardV2({ card, selected, isMyTurn, onDragStart, onDragEnd, onClick }: {
  card: Card; selected: boolean; isMyTurn: boolean;
  onDragStart: () => void; onDragEnd: () => void; onClick: () => void;
}) {
  const bdr = TYPE_BDR[card.type] ?? PLR.cardBdr;
  const bg  = TYPE_BG[card.type]  ?? PLR.cardBg;

  // card.operator already contains the full display string (e.g. "×10"), operator_value is the numeric
  const valueLabel = card.type === 'event'
    ? (card.effect_type ?? 'EVT').replace('_', ' ').toUpperCase().slice(0, 4)
    : card.value != null ? String(card.value)
    : card.operator != null ? card.operator.replace('÷', '/')
    : '?';

  const glow = selected
    ? `0 0 0 2px ${GOLD}, 0 0 24px rgba(201,168,76,0.5)`
    : '0 3px 10px rgba(0,0,0,0.5)';

  return (
    <div
      draggable={isMyTurn}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        width: 88, height: 130, borderRadius: 8, overflow: 'hidden',
        border: `2px solid ${selected ? GOLD : bdr}`,
        background: bg,
        boxShadow: glow,
        cursor: isMyTurn ? 'grab' : 'pointer',
        flexShrink: 0, userSelect: 'none',
        transition: 'transform 0.12s, box-shadow 0.2s',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1,
        marginRight: -10,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-16px) scale(1.08)';
        el.style.zIndex = '20';
        el.style.marginRight = '-10px';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(0) scale(1)';
        el.style.zIndex = '1';
        el.style.marginRight = '-10px';
      }}
    >
      {/* Art — 55% of 130px = 72px */}
      <div style={{
        height: 72, position: 'relative', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.15)', overflow: 'hidden',
      }}>
        {card.art_url
          ? <img src={card.art_url} alt={card.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.8em', position: 'relative', zIndex: 1 }}>{card.art_emoji}</span>
        }
      </div>

      {/* Value panel — 45% of 130px = 58px */}
      <div style={{
        flex: 1, background: '#08080f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
        padding: '4px 4px',
      }}>
        <div style={{
          fontFamily: DISPLAY, fontWeight: 900, fontSize: '24px', lineHeight: 1,
          color: selected ? GOLD : (TYPE_VAL[card.type] ?? '#90caf9'),
          textShadow: selected
            ? '0 0 10px rgba(201,168,76,0.7)'
            : `0 0 8px ${(TYPE_VAL[card.type] ?? '#90caf9')}88`,
        }}>
          {valueLabel}
        </div>
        <div style={{
          width: '100%', textAlign: 'center',
          fontFamily: DISPLAY, fontSize: '8px', letterSpacing: '0.08em',
          color: TYPE_VAL[card.type] ?? '#90caf9',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          opacity: 0.6,
        }}>
          {card.name}
        </div>
      </div>
    </div>
  );
}

// ── Game-complete body builder (exported for tests) ────────────────────────
export function buildCompleteBody(state: GameState, playerScore: number, opponentScore: number) {
  return {
    winner:          state.winner as 'player' | 'opponent' | 'tie',
    playerScore,
    opponentScore,
    aiDifficulty:    (state.options?.aiDifficulty ?? 'normal') as 'easy' | 'normal' | 'hard' | 'expert',
    customDeckId:    state.options?.customDeckId ?? null,
    fieldReleaseIds: state.player.field
      .map(fc => fc.card.release_id)
      .filter((id): id is number => id != null),
    fieldCount:      state.player.field.length,
  };
}

export interface LearningStats {
  total: number;
  correct: number;
  item: { total: number; correct: number };
  action: { total: number; correct: number };
}

function emptyLearningStats(): LearningStats {
  return { total: 0, correct: 0, item: { total: 0, correct: 0 }, action: { total: 0, correct: 0 } };
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  state: GameState;
  onStateChange: (s: GameState) => void;
  mode: 'ai' | 'pass-and-play';
  onNewGame: (learningStats: LearningStats | null) => void;
  playerNames?: { player: string; opponent: string };
  aiEventAnnouncement?: { card: Card; playedBy: 'opponent' } | null;
  onAiEventDismissed?: () => void;
}

interface ModifierFlash { creatureId: number; card: Card; oldValue: number; newValue: number; }

// ── Main board ─────────────────────────────────────────────────────────────
export default function GameBoardV2({ state, onStateChange, mode, onNewGame, playerNames, aiEventAnnouncement, onAiEventDismissed }: Props) {
  const isMobile = useWindowWidth() < 640;
  const [modalData,        setModalData]        = useState<{ fieldCard?: FieldCardType; handCard?: Card } | null>(null);
  const [selectedCard,     setSelectedCard]     = useState<Card | null>(null);
  const [firstEventTarget, setFirstEventTarget] = useState<{ creatureId: number; side: Side } | null>(null);
  const [learningCheck,    setLearningCheck]    = useState<{ fieldCard: FieldCardType; modifierCard: Card; onConfirm: () => void } | null>(null);
  const learningStatsRef = useRef<LearningStats>(emptyLearningStats());
  const [draggedCard,      setDraggedCard]      = useState<Card | null>(null);
  const [eventAnnounce,    setEventAnnounce]    = useState<{ card: Card; applyFn: () => void } | null>(null);
  const [modifierFlash,    setModifierFlash]    = useState<ModifierFlash | null>(null);
  const modFlashTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggedCardRef   = useRef<Card | null>(null);
  const dropJustFired    = useRef(false);
  const completeCalled   = useRef(false);

  const [showHandoff,      setShowHandoff]      = useState(mode === 'pass-and-play');
  const [questsCompleted,  setQuestsCompleted]  = useState<string[]>([]);
  const [handoffNext, setHandoffNext] = useState<GameState | null>(null);

  function trackLearningPrompt(modCard: Card) {
    learningStatsRef.current.total += 1;
    if (modCard.type === 'item')   learningStatsRef.current.item.total += 1;
    if (modCard.type === 'action') learningStatsRef.current.action.total += 1;
  }

  const flipped      = mode === 'pass-and-play' && state.turn === 'opponent';
  const topSide: Side    = flipped ? 'player'   : 'opponent';
  const bottomSide: Side = flipped ? 'opponent' : 'player';
  const activeSide: Side = mode === 'pass-and-play' ? state.turn : 'player';
  const isMyTurn     = mode === 'pass-and-play' ? true : state.turn === 'player';
  const gameOver     = isGameOver(state);
  const winner       = gameOver ? getWinner(state) : null;

  // Zone themes: top = crimson, bottom = navy (always, regardless of flipped)
  const topTheme    = OPP;
  const bottomTheme = PLR;

  const playerScore   = computeScore(state.player.field);
  const oppScore      = computeScore(state.opponent.field);

  useEffect(() => {
    if (!gameOver || mode !== 'ai' || completeCalled.current) return;
    completeCalled.current = true;
    const body = buildCompleteBody(state, playerScore, oppScore);
    fetch('/api/games/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then((data: { questsCompleted?: string[] }) => {
        if (data.questsCompleted && data.questsCompleted.length > 0) {
          setQuestsCompleted(data.questsCompleted);
        }
      })
      .catch(() => { /* non-fatal — game over screen shows regardless */ });
  }, [gameOver, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Figure out which zone shows which player's score
  const topScore    = computeScore(state[topSide].field);
  const bottomScore = computeScore(state[bottomSide].field);
  const topWinning    = topScore > bottomScore;
  const bottomWinning = bottomScore > topScore;

  const endTurnInMode = useCallback((next: GameState) => {
    if (mode === 'pass-and-play') { setHandoffNext(next); setShowHandoff(true); }
    else onStateChange(next);
  }, [mode, onStateChange]);

  const dismissHandoff = useCallback(() => {
    const next = handoffNext;
    setHandoffNext(null); setShowHandoff(false);
    if (next) onStateChange(next);
  }, [handoffNext, onStateChange]);

  const clearSelection = useCallback(() => {
    setSelectedCard(null); setFirstEventTarget(null); setModalData(null); setLearningCheck(null);
  }, []);

  const playAndEndTurn = useCallback((next: GameState) => {
    clearSelection();
    endTurnInMode(endTurn(next));
  }, [endTurnInMode, clearSelection]);

  const playModifierWithFlash = useCallback((cur: GameState, cardId: number, creatureId: number, side: Side) => {
    const targetFc = cur[side].field.find(fc => fc.card.id === creatureId);
    const modCard  = cur[cur.turn].hand.find(c => c.id === cardId);
    const oldValue = targetFc ? computeCardValue(targetFc) : 0;
    const next     = playModifier(cur, cardId, creatureId, side);
    const newFc    = next[side].field.find(fc => fc.card.id === creatureId);
    if (modCard && targetFc) {
      if (modFlashTimer.current) clearTimeout(modFlashTimer.current);
      setModifierFlash({ creatureId, card: modCard, oldValue, newValue: newFc ? computeCardValue(newFc) : 0 });
      modFlashTimer.current = setTimeout(() => setModifierFlash(null), 1700);
    }
    clearSelection();
    endTurnInMode(endTurn(next));
  }, [endTurnInMode, clearSelection]);

  const handleHandCardClick = useCallback((card: Card) => {
    if (gameOver) return;
    setModalData({ handCard: card });
  }, [gameOver]);

  const handlePlayFromModal = useCallback((card: Card) => {
    setModalData(null); setSelectedCard(card); setFirstEventTarget(null);
  }, []);

  const handleDragStart = useCallback((card: Card) => {
    draggedCardRef.current = card; setDraggedCard(card); setSelectedCard(card);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedCardRef.current = null; setDraggedCard(null);
  }, []);

  const handleDropOnZone = useCallback((side: Side) => {
    const card = draggedCardRef.current ?? selectedCard;
    if (!card || card.type !== 'creature') return;
    dropJustFired.current = true;
    requestAnimationFrame(() => { dropJustFired.current = false; });
    draggedCardRef.current = null; setDraggedCard(null);
    playAndEndTurn(playCreature(state, card.id, side));
  }, [selectedCard, state, playAndEndTurn]);

  const handleFieldZoneClick = useCallback((side: Side) => {
    if (dropJustFired.current) return;
    if (gameOver || !selectedCard || selectedCard.type !== 'creature') return;
    playAndEndTurn(playCreature(state, selectedCard.id, side));
  }, [gameOver, selectedCard, state, playAndEndTurn]);

  const handleFieldCardClick = useCallback((fc: FieldCardType, side: Side) => {
    if (gameOver) { setModalData({ fieldCard: fc }); return; }
    if (!selectedCard) { setModalData({ fieldCard: fc }); return; }
    if (!isMyTurn) { setSelectedCard(null); setFirstEventTarget(null); setModalData({ fieldCard: fc }); return; }

    if (selectedCard.type === 'item' || selectedCard.type === 'action') {
      const doPlay = () => playModifierWithFlash(state, selectedCard.id, fc.card.id, side);
      if (state.learningMode) { setModalData(null); trackLearningPrompt(selectedCard); setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
      doPlay(); return;
    }

    if (selectedCard.type === 'event') {
      const effect = selectedCard.effect_type;
      if (effect === 'swap' || effect === 'mirror') {
        if (!firstEventTarget) { setFirstEventTarget({ creatureId: fc.card.id, side }); return; }
        const doPlay = () => {
          const next = playEvent(state, selectedCard.id, firstEventTarget.creatureId, firstEventTarget.side, fc.card.id, side);
          setEventAnnounce({ card: selectedCard, applyFn: () => playAndEndTurn(next) });
          clearSelection();
        };
        if (state.learningMode && effect === 'mirror') { trackLearningPrompt(selectedCard); setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
        doPlay(); return;
      }
      const doPlay = () => {
        const next = playEvent(state, selectedCard.id, fc.card.id, side);
        setEventAnnounce({ card: selectedCard, applyFn: () => playAndEndTurn(next) });
        clearSelection();
      };
      if (state.learningMode && (effect === 'x100' || effect === 'reverse' || effect === 'square')) {
        const cur = state[side].field.find(f => f.card.id === fc.card.id);
        const syntheticMod: Card = { ...selectedCard, operator_value: effect === 'x100' ? 100 : effect === 'square' ? (cur ? computeCardValue(cur) : 0) : -1, type: 'action' };
        trackLearningPrompt(syntheticMod); setLearningCheck({ fieldCard: fc, modifierCard: syntheticMod, onConfirm: doPlay }); return;
      }
      doPlay(); return;
    }
  }, [gameOver, isMyTurn, selectedCard, firstEventTarget, state, playAndEndTurn, playModifierWithFlash, clearSelection]);

  const handleDropOnFieldCard = useCallback((fc: FieldCardType, side: Side) => {
    const card = draggedCardRef.current;
    if (!card) return;
    dropJustFired.current = true;
    requestAnimationFrame(() => { dropJustFired.current = false; });
    draggedCardRef.current = null; setDraggedCard(null); setSelectedCard(null);
    if (card.type === 'item' || card.type === 'action') {
      const doPlay = () => playModifierWithFlash(state, card.id, fc.card.id, side);
      if (state.learningMode) { trackLearningPrompt(card); setLearningCheck({ fieldCard: fc, modifierCard: card, onConfirm: doPlay }); }
      else doPlay();
    } else if (card.type === 'event') {
      setSelectedCard(card);
    }
  }, [state, playModifierWithFlash]);

  const isCreatureSelected = selectedCard?.type === 'creature';
  const isTargeting        = !!selectedCard && selectedCard.type !== 'creature';

  const instructionText = !selectedCard ? null
    : isCreatureSelected ? (isMobile ? 'Tap zone' : 'Click a zone to place')
    : selectedCard.type === 'event' && (selectedCard.effect_type === 'swap' || selectedCard.effect_type === 'mirror') && !firstEventTarget ? (isMobile ? '1st target' : 'Click first target')
    : selectedCard.type === 'event' && firstEventTarget ? (isMobile ? '2nd target' : 'Click second target')
    : (isMobile ? 'Tap creature' : 'Click a creature to apply');

  const showEventModal = eventAnnounce || (aiEventAnnouncement ?? null);
  const eventCard      = eventAnnounce?.card ?? aiEventAnnouncement?.card ?? null;
  const eventPlayedBy  = eventAnnounce ? 'player' : 'opponent';
  const dismissEvent   = () => {
    if (eventAnnounce) { const fn = eventAnnounce.applyFn; setEventAnnounce(null); fn(); }
    else onAiEventDismissed?.();
  };

  const fieldZoneStyle = (accepting: boolean): React.CSSProperties => ({
    minHeight: isMobile ? 0 : 240,
    padding: isMobile ? '8px 6px' : '14px 14px',
    display: 'flex', gap: isMobile ? 10 : 18,
    flexWrap: isMobile ? 'nowrap' : 'wrap',
    overflowX: isMobile ? 'auto' : undefined,
    WebkitOverflowScrolling: isMobile ? ('touch' as React.CSSProperties['WebkitOverflowScrolling']) : undefined,
    alignItems: 'flex-start',
    borderRadius: 8,
    border: accepting ? `2px dashed rgba(201,168,76,0.5)` : '2px solid transparent',
    cursor: accepting ? 'pointer' : 'default',
    transition: 'border-color 0.2s',
  });

  const renderZone = (side: Side, theme: typeof OPP) => {
    const accepting = isCreatureSelected;
    return (
      <div
        onClick={() => handleFieldZoneClick(side)}
        onDragOver={e => { if (accepting || draggedCard?.type === 'creature') e.preventDefault(); }}
        onDrop={() => handleDropOnZone(side)}
        style={{
          ...fieldZoneStyle(accepting),
          background: accepting ? theme.fieldBg : 'transparent',
          borderColor: accepting ? `rgba(201,168,76,0.4)` : theme.fieldBdr,
          position: 'relative',
        }}
      >
        <span style={{
          position: 'absolute', top: -7, left: 10,
          fontFamily: DISPLAY, fontSize: '7px', letterSpacing: '0.15em',
          color: theme.label,
          background: side === topSide ? OPP.zoneBg.slice(OPP.zoneBg.indexOf('#')) : PLR.zoneBg.slice(PLR.zoneBg.indexOf('#')),
          padding: '0 5px',
        }}>
          {side === topSide ? (flipped ? 'YOUR FIELD' : 'OPPONENT FIELD') : 'YOUR FIELD'}
        </span>

        {state[side].field.map(fc => (
          <div key={fc.card.id}
            onDragOver={e => { if (isTargeting || (draggedCard && draggedCard.type !== 'creature')) e.preventDefault(); }}
            onDrop={() => handleDropOnFieldCard(fc, side)}
          >
            <FieldCardV2
              fc={fc}
              theme={theme}
              onClick={() => handleFieldCardClick(fc, side)}
              highlighted={isTargeting || !!firstEventTarget}
              isFirstTarget={firstEventTarget?.creatureId === fc.card.id && firstEventTarget?.side === side}
              flashCard={modifierFlash?.creatureId === fc.card.id ? modifierFlash.card : null}
            />
          </div>
        ))}
        {state[side].field.length === 0 && accepting && (
          <span style={{ color: theme.deckTxt, alignSelf: 'center', fontStyle: 'italic', fontSize: '11px', fontFamily: SERIF }}>
            Place creature here
          </span>
        )}
      </div>
    );
  };

  const topLabel    = flipped ? 'PLAYER 1' : 'PLAYER 2';
  const bottomLabel = flipped ? 'PLAYER 2' : 'YOU';

  return (
    <div style={{ fontFamily: SERIF }}>
      {/* ── Wooden frame ── */}
      <div style={{
        padding: isMobile ? 6 : 12,
        background: 'linear-gradient(135deg, #3d2b1f 0%, #5d4037 30%, #2a1a0a 60%, #3d2b1f 100%)',
        borderRadius: 18,
        boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5), 0 8px 48px rgba(0,0,0,0.7)',
        position: 'relative',
      }}>
        {/* Filigree corners */}
        {(['topleft','topright','bottomleft','bottomright'] as const).map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            top: pos.startsWith('top') ? 2 : undefined,
            bottom: pos.startsWith('bottom') ? 2 : undefined,
            left: pos.endsWith('left') ? 2 : undefined,
            right: pos.endsWith('right') ? 2 : undefined,
            color: GOLD, fontSize: '14px', opacity: 0.5,
            fontFamily: 'serif', lineHeight: 1,
            transform: pos === 'topright' ? 'rotate(90deg)' : pos === 'bottomright' ? 'rotate(180deg)' : pos === 'bottomleft' ? 'rotate(-90deg)' : 'none',
          }}>❈</div>
        ))}

        {/* ── Inner board ── */}
        <div style={{ borderRadius: 10, overflow: 'hidden' }}>

          {/* ── Opponent / top zone ── */}
          <div style={{
            background: OPP.zoneBg,
            padding: isMobile ? '8px 8px' : '12px 14px',
            borderBottom: '1px solid rgba(180,40,40,0.1)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: OPP.zoneGlow,
            }} />

            {/* Opp score row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 6 : 10, position: 'relative' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: '9px', letterSpacing: '0.15em', color: OPP.label, textTransform: 'uppercase' }}>
                {topLabel}
              </span>
              <ScoreBadge score={topScore} winning={topWinning} theme={OPP} small={isMobile} />
              <DeckPill count={state[topSide].deck.length} theme={OPP} />
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: 4 }}>
                {state[topSide].hand.slice(0, isMobile ? 3 : 6).map((_, i) => <OppHandCard key={i} />)}
                {state[topSide].hand.length > (isMobile ? 3 : 6) && (
                  <span style={{ fontSize: '10px', color: OPP.deckTxt, marginLeft: 14, fontFamily: DISPLAY }}>
                    +{state[topSide].hand.length - (isMobile ? 3 : 6)}
                  </span>
                )}
              </div>
            </div>

            {/* Opp field */}
            {renderZone(topSide, OPP)}
          </div>

          {/* ── Gold divider ── */}
          <div style={{
            height: 36,
            background: 'linear-gradient(90deg, #0c0506, #160a0a 30%, #0a0a16 70%, #05060f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${GOLD} 20%, ${GOLD} 80%, transparent)`,
              boxShadow: `0 0 10px rgba(201,168,76,0.5)`,
              transform: 'translateY(-50%)',
            }} />
            {!isMobile && (
              <span style={{ fontFamily: DISPLAY, fontSize: '8px', letterSpacing: '0.15em', color: '#3a2a3a', position: 'relative', zIndex: 1 }}>
                ROUND {state.round}
              </span>
            )}
            <div style={{
              background: '#100a20', border: `1px solid ${GOLD}`,
              borderRadius: 20, padding: isMobile ? '4px 12px' : '4px 16px',
              fontFamily: DISPLAY, fontSize: '9px', letterSpacing: '0.2em', color: GOLD,
              boxShadow: `0 0 12px rgba(201,168,76,0.2)`,
              position: 'relative', zIndex: 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✦ {isMyTurn ? 'YOUR TURN' : `${topLabel}'S TURN`} ✦</span>
              {instructionText && (
                <span style={{ color: '#9090c0', fontSize: '0.85em' }}>· {instructionText}</span>
              )}
            </div>
            {!isMobile && (
              <span style={{ fontFamily: DISPLAY, fontSize: '8px', letterSpacing: '0.15em', color: '#3a2a3a', position: 'relative', zIndex: 1 }}>
                {state.player.deck.length + state.opponent.deck.length} cards left
              </span>
            )}
            {selectedCard && isMyTurn && (
              <button
                onClick={() => { setSelectedCard(null); setFirstEventTarget(null); }}
                style={{
                  position: 'absolute', right: 10, zIndex: 2,
                  background: 'rgba(127,0,0,0.3)', color: '#ef9a9a',
                  border: '1px solid rgba(239,154,154,0.25)', borderRadius: 5,
                  padding: '2px 10px', cursor: 'pointer', fontFamily: DISPLAY, fontSize: '8px',
                }}
              >✕ Cancel</button>
            )}
          </div>

          {/* ── Player / bottom zone ── */}
          <div style={{
            background: PLR.zoneBg,
            padding: isMobile ? '8px 8px' : '12px 14px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: PLR.zoneGlow,
            }} />

            {/* Player field */}
            <div style={{ marginBottom: isMobile ? 6 : 10, position: 'relative' }}>
              {renderZone(bottomSide, PLR)}
            </div>

            {/* Player score + hand row */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: '9px', letterSpacing: '0.15em', color: PLR.label, textTransform: 'uppercase', flexShrink: 0 }}>
                  {bottomLabel}
                </span>
                <ScoreBadge score={bottomScore} winning={bottomWinning} theme={PLR} small={isMobile} />
                <DeckPill count={state[bottomSide].deck.length} theme={PLR} />

                <div style={{ flex: 1 }} />

                {/* On mobile: hand cards are below; pass button stays in this row */}
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingRight: 22 }}>
                    {state[activeSide].hand.map(card => (
                      <HandCardV2
                        key={card.id}
                        card={card}
                        selected={selectedCard?.id === card.id}
                        isMyTurn={isMyTurn}
                        onDragStart={() => handleDragStart(card)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleHandCardClick(card)}
                      />
                    ))}
                  </div>
                )}

                {/* Pass turn */}
                {isMyTurn && !gameOver && (
                  <button
                    onClick={() => { setSelectedCard(null); setFirstEventTarget(null); endTurnInMode(passTurn(state)); }}
                    style={{
                      background: 'rgba(201,168,76,0.08)', color: '#6a5820',
                      border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8,
                      padding: '6px 14px', cursor: 'pointer',
                      fontFamily: DISPLAY, fontSize: '9px', letterSpacing: '0.1em',
                      flexShrink: 0, whiteSpace: 'nowrap',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = GOLD;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#6a5820';
                    }}
                  >
                    Pass →
                  </button>
                )}
              </div>

              {/* Mobile-only scrollable hand strip */}
              {isMobile && (
                <div style={{
                  overflowX: 'auto', display: 'flex', alignItems: 'flex-end',
                  marginTop: 8, paddingBottom: 4,
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {state[activeSide].hand.map(card => (
                    <HandCardV2
                      key={card.id}
                      card={card}
                      selected={selectedCard?.id === card.id}
                      isMyTurn={isMyTurn}
                      onDragStart={() => handleDragStart(card)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleHandCardClick(card)}
                    />
                  ))}
                  {/* Trailing space so last card isn't clipped */}
                  <div style={{ flexShrink: 0, width: 20 }} />
                </div>
              )}
            </div>
          </div>

        </div>{/* end inner board */}
      </div>{/* end wooden frame */}

      {/* ── Overlays ── */}
      {modalData && (
        <CardModal
          fieldCard={modalData.fieldCard}
          handCard={modalData.handCard}
          releaseNumber={modalData.fieldCard?.card.release?.number ?? modalData.handCard?.release?.number}
          onClose={() => setModalData(null)}
          onPlay={modalData.handCard && isMyTurn ? () => handlePlayFromModal(modalData.handCard!) : undefined}
        />
      )}
      {learningCheck && (
        <LearningModePrompt
          fieldCard={learningCheck.fieldCard}
          modifierCard={learningCheck.modifierCard}
          onCorrect={(wasFirstAttempt) => {
            if (wasFirstAttempt) {
              learningStatsRef.current.correct += 1;
              const t = learningCheck.modifierCard.type;
              if (t === 'item')   learningStatsRef.current.item.correct += 1;
              if (t === 'action') learningStatsRef.current.action.correct += 1;
            }
            setLearningCheck(null);
            learningCheck.onConfirm();
          }}
          onDismiss={() => setLearningCheck(null)}
        />
      )}
      {gameOver && winner && (
        <GameOverScreen
          winner={winner}
          playerScore={playerScore}
          opponentScore={oppScore}
          onNewGame={() => onNewGame(
            state.learningMode && learningStatsRef.current.total > 0
              ? { ...learningStatsRef.current, item: { ...learningStatsRef.current.item }, action: { ...learningStatsRef.current.action } }
              : null
          )}
          questsCompleted={questsCompleted}
          learningStats={
            state.learningMode && learningStatsRef.current.total > 0
              ? { ...learningStatsRef.current, item: { ...learningStatsRef.current.item }, action: { ...learningStatsRef.current.action } }
              : null
          }
        />
      )}
      {showEventModal && eventCard && (
        <EventAnnouncement card={eventCard} playedBy={eventPlayedBy as 'player' | 'opponent'} onDismiss={dismissEvent} />
      )}
      {showHandoff && mode === 'pass-and-play' && !gameOver && (
        <HandoffScreen
          playerName={(handoffNext ?? state).turn === 'player'
            ? (playerNames?.player ?? 'Player 1')
            : (playerNames?.opponent ?? 'Player 2')}
          onReady={dismissHandoff}
        />
      )}
    </div>
  );
}
