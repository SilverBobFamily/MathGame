import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('id', user.id)
          .single();
        // New OAuth user — no players row yet, needs to pick a username
        if (!player) {
          return NextResponse.redirect(`${origin}/auth/username`);
        }
      }
      return NextResponse.redirect(`${origin}/game`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
