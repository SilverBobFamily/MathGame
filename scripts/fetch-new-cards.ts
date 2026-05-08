import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  // SilverBobs check
  const { data: sbCards } = await sb.from('cards').select('id,name,art_url').eq('release_id', 79).order('id');
  const sbMissing = sbCards?.filter(c => !c.art_url) ?? [];
  console.log(`SilverBobs (id=79): ${sbCards?.length} total, ${sbMissing.length} missing art`);
  if (sbMissing.length > 0) console.log('  Missing:', sbMissing.map(c => `${c.id}:${c.name}`).join(', '));

  // New releases
  const releaseIds = [82,83,84,85,86,87,1743,1745,1746,1747,1748,1749,1750];
  for (const rid of releaseIds) {
    const { data: rel } = await sb.from('releases').select('number,name').eq('id', rid).single();
    const { data: cards } = await sb.from('cards').select('id,name,type').eq('release_id', rid).order('id');
    console.log(`\nR${rel?.number} "${rel?.name}" (db_id=${rid}):`);
    cards?.forEach(c => console.log(`  ${c.id}  ${c.type.padEnd(8)}  ${c.name}`));
  }
}
main();
