import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const updates = [
  { id: 1230, name: "Reese's Peanut Butter Cup", art_emoji: '🥜', flavor_text: "H.B. Reese had one idea: what if you put these two things together? The question was answered in 1928. Nobody has improved on the answer." },
  { id: 1231, name: 'Snickers',                  art_emoji: '🍫', flavor_text: "Named after the Mars family horse. The horse was good. The bar outsold everything." },
  { id: 1232, name: 'Baby Ruth',                  art_emoji: '⚾', flavor_text: "Named after Ruth Cleveland. Or Babe Ruth. The debate has lasted a century. The candy does not care." },
  { id: 1233, name: '3 Musketeers',               art_emoji: '⚔️', flavor_text: "Originally three flavors: chocolate, vanilla, and strawberry. The other two didn't make it. One musketeer remains." },
  { id: 1234, name: 'Tootsie Roll',               art_emoji: '🍬', flavor_text: "Named after Mr. Hirschfield's daughter. She went by Tootsie. The name has outlasted everything else." },
  { id: 1235, name: 'Heath Bar',                  art_emoji: '🍯', flavor_text: "The Heath brothers made it in a drugstore. Almond toffee. Shatters when you bite it. Worth it." },
  { id: 1236, name: 'Oh Henry!',                  art_emoji: '❗', flavor_text: "Named after a young man who kept coming to the candy counter to flirt. At some point they just gave him a bar." },
  { id: 1237, name: 'Mr. Goodbar',                art_emoji: '🎩', flavor_text: "Hershey's peanut chocolate bar. Mr. Goodbar has never had a bad day and shows no signs of starting." },
  { id: 1238, name: 'Mary Jane',                  art_emoji: '🌸', flavor_text: "Named after the inventor's niece. Molasses and peanut butter. Old-fashioned. Entirely unbothered by that." },
  { id: 1239, name: 'Junior Mints',               art_emoji: '🌿', flavor_text: "Named after the Broadway show. Small, minty, chocolate-coated. Perfect for sneaking into a movie." },
  { id: 1240, name: 'Mike and Ike',               art_emoji: '👫', flavor_text: "Nobody knows which one was Mike and which was Ike. They came together. They stay together." },
  { id: 1241, name: 'Clark Bar',                  art_emoji: '🔵', flavor_text: "Named after D.L. Clark. Crispy peanut butter, chocolate outside. Largely forgotten. Still good." },
  { id: 1242, name: 'Bonomo Turkish Taffy',       art_emoji: '🪃', flavor_text: "Victor Bonomo's stretchy taffy. Whack it against the counter, it shatters. Warm it up, it pulls forever. Gets stuck in everything." },
  { id: 1243, name: 'Chuckles',                   art_emoji: '🤡', flavor_text: "Chuckles is a clown name and also what these sugar-coated jelly candies are called. Both facts are unsettling." },
];

async function main() {
  for (const u of updates) {
    const { error } = await sb.from('cards').update({ name: u.name, art_emoji: u.art_emoji, flavor_text: u.flavor_text }).eq('id', u.id);
    if (error) { console.error(`Error updating ${u.id}:`, error); process.exit(1); }
    console.log(`✓ ${u.id} → ${u.name}`);
  }
  console.log('Done.');
}
main();
