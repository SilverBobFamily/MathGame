import type { GameState, Side } from './types';
import { computeScore, playCreature, playModifier, playEvent } from './GameEngine';

export interface AiMove {
  cardId: number;
  targetSide: Side;
  targetCreatureId?: number;
  secondTargetId?: number;
  secondTargetSide?: Side;
}

function scoreState(s: GameState): number {
  return computeScore(s.opponent.field) - computeScore(s.player.field);
}

function buildAllMoves(state: GameState): AiMove[] {
  const hand = state.opponent.hand;
  const ownField = state.opponent.field;
  const oppField = state.player.field;
  const moves: AiMove[] = [];

  for (const card of hand) {
    if (card.type === 'creature') {
      moves.push({ cardId: card.id, targetSide: 'opponent' });
      moves.push({ cardId: card.id, targetSide: 'player' });
      continue;
    }
    if (card.type === 'item' || card.type === 'action') {
      for (const fc of ownField) moves.push({ cardId: card.id, targetSide: 'opponent', targetCreatureId: fc.card.id });
      for (const fc of oppField) moves.push({ cardId: card.id, targetSide: 'player',   targetCreatureId: fc.card.id });
      continue;
    }
    if (card.type === 'event') {
      const effect = card.effect_type;
      if (effect === 'zero_out' || effect === 'banish') {
        for (const fc of oppField) moves.push({ cardId: card.id, targetSide: 'player', targetCreatureId: fc.card.id });
      } else if (effect === 'x100' || effect === 'square') {
        for (const fc of ownField) moves.push({ cardId: card.id, targetSide: 'opponent', targetCreatureId: fc.card.id });
      } else if (effect === 'reverse' || effect === 'reset') {
        for (const fc of ownField) moves.push({ cardId: card.id, targetSide: 'opponent', targetCreatureId: fc.card.id });
        for (const fc of oppField) moves.push({ cardId: card.id, targetSide: 'player',   targetCreatureId: fc.card.id });
      } else if (effect === 'multi_zero' || effect === 'reverse_all') {
        const anchor = oppField[0] ?? ownField[0];
        if (anchor) {
          const side: Side = oppField.length > 0 ? 'player' : 'opponent';
          moves.push({ cardId: card.id, targetSide: side, targetCreatureId: anchor.card.id });
        }
      } else if (effect === 'mirror' || effect === 'swap') {
        for (const own of ownField) {
          for (const opp of oppField) {
            moves.push({ cardId: card.id, targetSide: 'opponent', targetCreatureId: own.card.id, secondTargetId: opp.card.id, secondTargetSide: 'player' });
          }
        }
      }
    }
  }
  return moves;
}

function applyMove(state: GameState, move: AiMove): GameState | null {
  const card = state.opponent.hand.find(c => c.id === move.cardId);
  if (!card) return null;
  if (card.type === 'creature') return playCreature(state, move.cardId, move.targetSide);
  if ((card.type === 'item' || card.type === 'action') && move.targetCreatureId !== undefined)
    return playModifier(state, move.cardId, move.targetCreatureId, move.targetSide);
  if (card.type === 'event' && move.targetCreatureId !== undefined)
    return playEvent(state, move.cardId, move.targetCreatureId, move.targetSide, move.secondTargetId, move.secondTargetSide);
  return null;
}

function greedyMove(state: GameState): AiMove | null {
  const moves = buildAllMoves(state);
  let best: AiMove | null = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = applyMove(state, move);
    if (!next) continue;
    const s = scoreState(next);
    if (s > bestScore) { bestScore = s; best = move; }
  }
  return best;
}

function expertMove(state: GameState): AiMove | null {
  const aiMoves = buildAllMoves(state);
  let best: AiMove | null = null;
  let bestNet = -Infinity;

  for (const aiM of aiMoves) {
    const afterAi = applyMove(state, aiM);
    if (!afterAi) continue;

    const flipped: GameState = {
      ...afterAi,
      turn: 'player' as Side,
      player:   { ...afterAi.opponent },
      opponent: { ...afterAi.player },
    };

    let worstForAi = scoreState(afterAi);
    for (const pM of buildAllMoves(flipped)) {
      const afterPlayer = applyMove(flipped, pM);
      if (!afterPlayer) continue;
      const aiScore = computeScore(afterPlayer.player.field) - computeScore(afterPlayer.opponent.field);
      if (aiScore < worstForAi) worstForAi = aiScore;
    }

    if (worstForAi > bestNet) { bestNet = worstForAi; best = aiM; }
  }

  return best ?? greedyMove(state);
}

function heuristicMove(state: GameState): AiMove | null {
  const hand = state.opponent.hand;
  if (hand.length === 0) return null;

  const creatures = hand.filter(c => c.type === 'creature');
  const actions   = hand.filter(c => c.type === 'action');
  const items     = hand.filter(c => c.type === 'item');
  const events    = hand.filter(c => c.type === 'event');

  const ownField = state.opponent.field;
  const oppField = state.player.field;

  if (creatures.length > 0) {
    const card = [...creatures].sort((a, b) => Math.abs(b.value ?? 0) - Math.abs(a.value ?? 0))[0];
    return { cardId: card.id, targetSide: (card.value ?? 0) < 0 ? 'player' : 'opponent' };
  }

  const bestOwn = ownField.length > 0 ? [...ownField].sort((a, b) => computeScore([b]) - computeScore([a]))[0] : null;
  const bestOpp = oppField.length > 0 ? [...oppField].sort((a, b) => computeScore([b]) - computeScore([a]))[0] : null;

  const boostActions = actions.filter(a => (a.operator_value ?? 0) > 1);
  const hurtActions  = actions.filter(a => (a.operator_value ?? 0) < 1);
  const posItems     = items.filter(i  => (i.operator_value  ?? 0) > 0);
  const negItems     = items.filter(i  => (i.operator_value  ?? 0) < 0);

  if (boostActions.length > 0 && bestOwn && computeScore([bestOwn]) > 0)
    return { cardId: [...boostActions].sort((a,b)=>(b.operator_value??0)-(a.operator_value??0))[0].id, targetSide: 'opponent', targetCreatureId: bestOwn.card.id };
  if (posItems.length > 0 && bestOwn)
    return { cardId: posItems[0].id, targetSide: 'opponent', targetCreatureId: bestOwn.card.id };
  if (hurtActions.length > 0 && bestOpp && computeScore([bestOpp]) > 0)
    return { cardId: hurtActions[0].id, targetSide: 'player', targetCreatureId: bestOpp.card.id };
  if (negItems.length > 0 && bestOpp)
    return { cardId: negItems[0].id, targetSide: 'player', targetCreatureId: bestOpp.card.id };

  if (events.length > 0) {
    const event = events[0];
    const effect = event.effect_type;
    if ((effect === 'zero_out' || effect === 'banish') && bestOpp)
      return { cardId: event.id, targetSide: 'player', targetCreatureId: bestOpp.card.id };
    if ((effect === 'x100' || effect === 'square') && bestOwn && computeScore([bestOwn]) > 1)
      return { cardId: event.id, targetSide: 'opponent', targetCreatureId: bestOwn.card.id };
    if ((effect === 'reverse' || effect === 'reset') && bestOpp)
      return { cardId: event.id, targetSide: 'player', targetCreatureId: bestOpp.card.id };
    if ((effect === 'multi_zero' || effect === 'reverse_all') && oppField.length > 0)
      return { cardId: event.id, targetSide: 'player', targetCreatureId: oppField[0].card.id };
    if (effect === 'mirror' && bestOwn && bestOpp)
      return { cardId: event.id, targetSide: 'opponent', targetCreatureId: bestOwn.card.id, secondTargetId: bestOpp.card.id, secondTargetSide: 'player' };
    if (effect === 'swap' && ownField.length > 0 && bestOpp) {
      const worstOwn = [...ownField].sort((a,b)=>computeScore([a])-computeScore([b]))[0];
      return { cardId: event.id, targetSide: 'opponent', targetCreatureId: worstOwn.card.id, secondTargetId: bestOpp.card.id, secondTargetSide: 'player' };
    }
  }

  return { cardId: hand[0].id, targetSide: 'opponent' };
}

function buildRandomMove(state: GameState): AiMove | null {
  const hand = state.opponent.hand;
  if (hand.length === 0) return null;
  const card = hand[Math.floor(Math.random() * hand.length)];
  if (card.type === 'creature') return { cardId: card.id, targetSide: 'opponent' };
  const opVal = card.operator_value ?? 0;
  const isBeneficial = card.type === 'item' ? opVal > 0 : opVal > 1;
  const pool = isBeneficial ? state.opponent.field : state.player.field;
  const side: Side = isBeneficial ? 'opponent' : 'player';
  if (pool.length === 0) return { cardId: card.id, targetSide: side };
  const target = pool[Math.floor(Math.random() * pool.length)];
  return { cardId: card.id, targetSide: side, targetCreatureId: target.card.id };
}

export function chooseAiMove(
  state: GameState,
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' = 'normal',
): AiMove | null {
  if (state.opponent.hand.length === 0) return null;
  if (difficulty === 'easy' && Math.random() < 0.6) return buildRandomMove(state);
  if (difficulty === 'hard')   return greedyMove(state);
  if (difficulty === 'expert') return expertMove(state);
  return heuristicMove(state);
}
