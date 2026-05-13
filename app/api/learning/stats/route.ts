import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface LearningBody {
  totalAttempted: number;
  totalCorrect: number;
  itemAttempted: number;
  itemCorrect: number;
  actionAttempted: number;
  actionCorrect: number;
}

export function mapLearningError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized') return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body') return { status: 400, body: { error: 'Invalid request body' } };
  console.error('[learning/stats] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export function validateLearningBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'invalid_body';
  const b = body as Record<string, unknown>;
  const fields: (keyof LearningBody)[] = [
    'totalAttempted', 'totalCorrect',
    'itemAttempted', 'itemCorrect',
    'actionAttempted', 'actionCorrect',
  ];
  for (const f of fields) {
    if (typeof b[f] !== 'number' || !Number.isInteger(b[f]) || (b[f] as number) < 0) {
      return 'invalid_body';
    }
  }
  if ((b.totalCorrect as number) > (b.totalAttempted as number)) return 'invalid_body';
  if ((b.itemCorrect as number) > (b.itemAttempted as number)) return 'invalid_body';
  if ((b.actionCorrect as number) > (b.actionAttempted as number)) return 'invalid_body';
  return null;
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const e = mapLearningError('unauthorized');
    return NextResponse.json(e.body, { status: e.status });
  }

  let body: unknown;
  try { body = await request.json(); } catch { body = null; }

  const validationError = validateLearningBody(body);
  if (validationError) {
    const e = mapLearningError(validationError);
    return NextResponse.json(e.body, { status: e.status });
  }

  const b = body as LearningBody;
  const { error } = await server.rpc('record_learning_session', {
    p_total_attempted:  b.totalAttempted,
    p_total_correct:    b.totalCorrect,
    p_item_attempted:   b.itemAttempted,
    p_item_correct:     b.itemCorrect,
    p_action_attempted: b.actionAttempted,
    p_action_correct:   b.actionCorrect,
  });

  if (error) {
    // error.message is a raw Postgres string; always falls through to 500 branch
    const e = mapLearningError(error.message);
    return NextResponse.json(e.body, { status: e.status });
  }
  return NextResponse.json({ ok: true });
}
