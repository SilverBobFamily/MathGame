-- Update coin awards: wins=15, ties=5, losses=2 coins per game

create or replace function award_win(p_winner_id uuid, p_loser_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  update players set
    coins        = coins + 15,
    games_won    = games_won + 1,
    games_played = games_played + 1,
    xp           = xp + 50
  where id = p_winner_id;

  update players set
    coins        = coins + 2,
    games_played = games_played + 1,
    xp           = xp + 15
  where id = p_loser_id;
end; $$;

create or replace function award_tie(p_player1_id uuid, p_player2_id uuid)
returns void language plpgsql security definer
set search_path = public as $$
begin
  update players set
    coins        = coins + 5,
    games_played = games_played + 1,
    xp           = xp + 25
  where id in (p_player1_id, p_player2_id);
end; $$;

-- Keep these callable by service_role only
revoke execute on function award_win(uuid, uuid) from public, anon, authenticated;
revoke execute on function award_tie(uuid, uuid) from public, anon, authenticated;
grant  execute on function award_win(uuid, uuid) to service_role;
grant  execute on function award_tie(uuid, uuid) to service_role;

-- open_pack: atomically deducts coins, draws 3 random unowned cards, inserts them.
-- p_pack_type: 'random_release' (50 coins) | 'same_release' (100 coins)
-- p_release_id: required when pack_type = 'same_release', ignored otherwise
-- Raises exceptions: 'insufficient_coins' | 'no_unowned_cards' | 'release_id required...'
create or replace function open_pack(
  p_player_id  uuid,
  p_pack_type  text,
  p_release_id int default null
)
returns table (
  card_id     int,
  name        text,
  type        text,
  art_emoji   text,
  art_url     text,
  flavor_text text,
  release_id  int
)
language plpgsql security definer
set search_path = public
as $$
declare
  v_cost     int;
  v_coins    int;
  v_card_ids int[];
begin
  case p_pack_type
    when 'random_release' then v_cost := 50;
    when 'same_release'   then v_cost := 100;
    else raise exception 'unknown pack type: %', p_pack_type;
  end case;

  if p_pack_type = 'same_release' and p_release_id is null then
    raise exception 'release_id required for same_release pack';
  end if;

  -- Lock the player row to prevent concurrent double-spend
  select coins into v_coins from players where id = p_player_id for update;
  if v_coins < v_cost then
    raise exception 'insufficient_coins';
  end if;

  -- Pick 3 random unowned cards the player can access
  select array_agg(sub.id) into v_card_ids
  from (
    select c.id
    from cards c
    join releases r on r.id = c.release_id
    where c.id not in (
      select pc.card_id from player_cards pc where pc.player_id = p_player_id
    )
    and (p_pack_type = 'random_release' or c.release_id = p_release_id)
    and (
      not r.private
      or exists (
        select 1 from player_release_access pra
        where pra.player_id = p_player_id and pra.release_id = r.id
      )
    )
    order by random()
    limit 3
  ) sub;

  if v_card_ids is null or array_length(v_card_ids, 1) = 0 then
    raise exception 'no_unowned_cards';
  end if;

  -- Grant cards and deduct coins atomically
  insert into player_cards (player_id, card_id)
  select p_player_id, unnest(v_card_ids)
  on conflict (player_id, card_id) do nothing;

  update players set coins = coins - v_cost where id = p_player_id;

  -- Return card details for the reveal
  return query
  select c.id, c.name, c.type, c.art_emoji, c.art_url, c.flavor_text, c.release_id
  from cards c
  where c.id = any(v_card_ids);
end;
$$;

-- Only the service role calls open_pack (via the /api/packs/open route)
revoke execute on function open_pack(uuid, text, int) from public, anon, authenticated;
grant  execute on function open_pack(uuid, text, int) to service_role;

-- get_releases_with_unowned: returns public releases where the caller has at least
-- one unowned card. Used by the pack shop to populate the same-release picker.
create or replace function get_releases_with_unowned()
returns table (
  id            int,
  name          text,
  icon          text,
  number        int,
  color_hex     text,
  unowned_count bigint
)
language sql security definer
set search_path = public
as $$
  select
    r.id,
    r.name,
    r.icon,
    r.number,
    r.color_hex,
    count(c.id) as unowned_count
  from releases r
  join cards c on c.release_id = r.id
  where not r.private
    and c.id not in (
      select pc.card_id from player_cards pc where pc.player_id = auth.uid()
    )
  group by r.id, r.name, r.icon, r.number, r.color_hex
  having count(c.id) > 0
  order by r.number;
$$;

revoke execute on function get_releases_with_unowned() from public, anon;
grant  execute on function get_releases_with_unowned() to authenticated;
