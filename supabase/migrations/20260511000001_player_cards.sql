-- supabase/migrations/20260511000001_player_cards.sql

-- ── Table ────────────────────────────────────────────────────────────────────
create table player_cards (
  player_id   uuid not null references players(id) on delete cascade,
  card_id     int  not null references cards(id)   on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (player_id, card_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table player_cards enable row level security;

-- Players may only read their own rows
create policy "player_cards: own read"
  on player_cards for select
  using (auth.uid() = player_id);

-- No direct client writes — all inserts go through security-definer functions

-- ── Seed function ─────────────────────────────────────────────────────────────
-- Grants all cards from releases 1-5 to a given player.
-- SECURITY DEFINER so it can bypass RLS and insert on behalf of the player.
create or replace function grant_starter_cards(p_player_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into player_cards (player_id, card_id)
  select p_player_id, c.id
  from   cards c
  join   releases r on r.id = c.release_id
  where  r.number <= 5
  on conflict do nothing;
end;
$$;

-- Only the service role and postgres (trigger context) may call this
revoke execute on function grant_starter_cards from public, anon, authenticated;
grant  execute on function grant_starter_cards to service_role;

-- ── Trigger: auto-seed on new player ─────────────────────────────────────────
create or replace function trigger_grant_starter_cards()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  perform grant_starter_cards(new.id);
  return new;
end;
$$;

create trigger after_player_insert
  after insert on players
  for each row execute function trigger_grant_starter_cards();

-- ── Backfill existing players ─────────────────────────────────────────────────
insert into player_cards (player_id, card_id)
select p.id, c.id
from   players p
cross  join cards c
join   releases r on r.id = c.release_id
where  r.number <= 5
on conflict do nothing;
