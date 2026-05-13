import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface CompleteBody {
  chapterId: number;
  winner: 'player' | 'opponent' | 'tie';
  playerScore: number;
  opponentScore: number;
}

export function mapCampaignError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized')      return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body')      return { status: 400, body: { error: 'Invalid request body' } };
  if (msg === 'chapter_not_found') return { status: 404, body: { error: 'Chapter not found' } };
  console.error('[campaign/complete] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const { status, body } = mapCampaignError('unauthorized');
    return NextResponse.json(body, { status });
  }

  let body: CompleteBody;
  try {
    body = await request.json() as CompleteBody;
    if (
      typeof body.chapterId !== 'number' ||
      !['player', 'opponent', 'tie'].includes(body.winner) ||
      typeof body.playerScore !== 'number' ||
      typeof body.opponentScore !== 'number'
    ) throw new Error();
  } catch {
    const { status, body: errBody } = mapCampaignError('invalid_body');
    return NextResponse.json(errBody, { status });
  }

  try {
    const { data, error } = await server.rpc('complete_campaign_chapter', {
      p_chapter_id:     body.chapterId,
      p_winner:         body.winner,
      p_player_score:   body.playerScore,
      p_opponent_score: body.opponentScore,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body: errBody } = mapCampaignError(msg);
    return NextResponse.json(errBody, { status });
  }
}
