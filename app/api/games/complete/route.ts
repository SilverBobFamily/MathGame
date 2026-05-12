import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase-service';
import { NextRequest, NextResponse } from 'next/server';

interface CompleteBody {
  winner: 'player' | 'opponent' | 'tie';
  playerScore: number;
  opponentScore: number;
  aiDifficulty: 'easy' | 'normal' | 'hard' | 'expert';
  customDeckId: string | null;
  fieldReleaseIds: number[];
  fieldCount: number;
}

export function mapCompleteError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized') return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body')  return { status: 400, body: { error: 'Invalid request body' } };
  console.error('[games/complete] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const { status, body } = mapCompleteError('unauthorized');
    return NextResponse.json(body, { status });
  }

  let body: CompleteBody;
  try {
    body = await request.json() as CompleteBody;
    if (!body.winner || typeof body.playerScore !== 'number') throw new Error('invalid');
  } catch {
    const { status, body: errBody } = mapCompleteError('invalid_body');
    return NextResponse.json(errBody, { status });
  }

  const service = createSupabaseServiceClient();

  try {
    const rpcName =
      body.winner === 'player' ? 'award_solo_win' :
      body.winner === 'tie'    ? 'award_solo_tie' :
                                 'award_solo_loss';
    const { error: awardErr } = await service.rpc(rpcName, { p_player_id: user.id });
    if (awardErr) throw new Error(awardErr.message);

    const gameContext = {
      winner:           body.winner,
      player_score:     body.playerScore,
      opponent_score:   body.opponentScore,
      ai_difficulty:    body.aiDifficulty,
      custom_deck_id:   body.customDeckId,
      field_release_ids: body.fieldReleaseIds,
      field_count:      body.fieldCount,
    };

    const { data: completed, error: questErr } = await service.rpc('check_daily_quests', {
      p_player_id: user.id,
      game_context: gameContext,
    });
    if (questErr) throw new Error(questErr.message);

    const xpAwarded =
      body.winner === 'player' ? 50 :
      body.winner === 'tie'    ? 25 : 15;

    return NextResponse.json({
      ok: true,
      questsCompleted: (completed as string[]) ?? [],
      xpAwarded,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body: errBody } = mapCompleteError(msg);
    return NextResponse.json(errBody, { status });
  }
}
