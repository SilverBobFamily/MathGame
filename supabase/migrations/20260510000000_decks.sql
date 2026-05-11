create table decks (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  card_ids   int[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger decks_updated_at before update on decks
  for each row execute procedure set_updated_at();

alter table decks enable row level security;

create policy "decks: owner select" on decks for select using (auth.uid() = player_id);
create policy "decks: owner insert" on decks for insert with check (auth.uid() = player_id);
create policy "decks: owner update" on decks for update using (auth.uid() = player_id);
create policy "decks: owner delete" on decks for delete using (auth.uid() = player_id);

grant select, insert, update, delete on decks to authenticated;
