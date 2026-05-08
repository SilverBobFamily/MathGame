import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: releases } = await sb.from('releases').select('id,number,name').order('number');
  for (const r of releases!) {
    const { count: total } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', r.id);
    const { count: withArt } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', r.id).not('art_url', 'is', null);
    const noArt = (total ?? 0) - (withArt ?? 0);
    const flag = withArt === 0 ? ' ← NONE' : noArt > 0 ? ` ← ${noArt} missing` : '';
    console.log(`R${r.number} "${r.name}" (db_id=${r.id}): ${withArt}/${total} have art${flag}`);
  }
}
main();
