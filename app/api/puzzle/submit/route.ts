import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface SubmitBody {
  puzzleId: number;
  submittedCardId: number;
  submittedTargetSide: 'player' | 'opponent';
  submittedCreatureId: number | null;
}

export function mapSubmitError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized')      return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body')      return { status: 400, body: { error: 'Invalid request body' } };
  if (msg === 'already_attempted') return { status: 200, body: { already_attempted: true } };
  console.error('[puzzle/submit] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const { status, body } = mapSubmitError('unauthorized');
    return NextResponse.json(body, { status });
  }

  let body: SubmitBody;
  try {
    body = await request.json() as SubmitBody;
    if (typeof body.puzzleId !== 'number' || typeof body.submittedCardId !== 'number') throw new Error();
  } catch {
    const { status, body: errBody } = mapSubmitError('invalid_body');
    return NextResponse.json(errBody, { status });
  }

  try {
    const { data, error } = await server.rpc('submit_puzzle_answer', {
      p_puzzle_id:             body.puzzleId,
      p_submitted_card_id:     body.submittedCardId,
      p_submitted_target_side: body.submittedTargetSide,
      p_submitted_creature_id: body.submittedCreatureId ?? null,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body: errBody } = mapSubmitError(msg);
    return NextResponse.json(errBody, { status });
  }
}
