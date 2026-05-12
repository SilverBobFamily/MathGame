import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseServiceClient } from '@/lib/supabase-service';

type PackType = 'random_release' | 'same_release';

function mapPackError(msg: string): { status: number; error: string } {
  if (msg === 'insufficient_coins') return { status: 402, error: 'Not enough coins.' };
  if (msg === 'no_unowned_cards')   return { status: 422, error: 'You already own all cards in this selection.' };
  return { status: 500, error: msg };
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let packType: PackType;
  let releaseId: number | null = null;
  try {
    const body = await request.json();
    packType = body.packType;
    releaseId = body.releaseId ?? null;
    if (packType !== 'random_release' && packType !== 'same_release') {
      return NextResponse.json({ error: 'Invalid packType' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data, error } = await service.rpc('open_pack', {
    p_player_id:  user.id,
    p_pack_type:  packType,
    p_release_id: releaseId,
  });

  if (error) {
    const mapped = mapPackError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  return NextResponse.json({ cards: data });
}
