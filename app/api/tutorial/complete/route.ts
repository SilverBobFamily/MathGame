import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

export function mapTutorialError(msg: string): { status: number; body: object } {
  if (msg === 'already_complete') return { status: 200, body: { ok: true, already: true } };
  console.error('[tutorial/complete] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST() {
  const server = createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createSupabaseServiceClient();

  try {
    const { error } = await service.rpc('award_tutorial_completion', { p_player_id: user.id });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body } = mapTutorialError(msg);
    return NextResponse.json(body, { status });
  }
}
