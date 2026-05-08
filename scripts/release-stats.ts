import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data: releases } = await sb.from('releases').select('id, number, name').order('number');
  for (const r of (releases ?? [])) {
    const { count: total } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', r.id);
    const { count: withArt } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', r.id).not('art_url', 'is', null);
    console.log(JSON.stringify({ number: r.number, name: r.name, total, withArt }));
  }
}
main();
