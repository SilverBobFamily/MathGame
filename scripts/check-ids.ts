import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: releases } = await supabase
    .from('releases')
    .select('id, number, name')
    .in('number', [26,27,28,30,31,32,33,34,35,36,37,38,39,40])
    .order('number');

  for (const rel of releases ?? []) {
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name, type')
      .eq('release_id', rel.id)
      .order('id');
    const ids = cards?.map(c => c.id) ?? [];
    console.log(`R${rel.number} (${rel.name}) dbId=${rel.id}: IDs ${ids[0]}–${ids[ids.length-1]}`);
    for (const c of cards ?? []) {
      console.log(`  ${c.id}: ${c.name} [${c.type}]`);
    }
  }
}
main().catch(console.error);
