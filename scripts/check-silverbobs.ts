import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data } = await sb
    .from('cards')
    .select('id, name, release_id')
    .gte('id', 241).lte('id', 285)
    .order('id');
  console.log(JSON.stringify(data, null, 2));
}
main();
