import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: release } = await supabase.from('releases').select('id').eq('number', 8).single();
  const { data } = await supabase
    .from('cards')
    .select('id, name, type')
    .eq('release_id', release!.id)
    .is('art_url', null)
    .order('type')
    .order('name');
  console.log(JSON.stringify(data, null, 2));
}
main();
