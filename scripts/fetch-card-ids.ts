import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data } = await sb.from('cards').select('id,name,type,flavor_text').in('release_id',[13,25]).order('release_id').order('type').order('id');
  console.log(JSON.stringify(data, null, 2));
}
main();
