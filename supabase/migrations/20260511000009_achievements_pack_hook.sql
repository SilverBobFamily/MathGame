-- Hook check_achievements into open_pack after card grants.
-- Redefines open_pack (originally from remote migration 000006) to add the achievement check.

create or replace function open_pack(
  p_player_id  uuid,
  p_pack_type  text,
  p_release_id int default null
) returns table(
  card_id      int,
  name         text,
  type         text,
  art_emoji    text,
  art_url      text,
  flavor_text  text,
  release_id   int
) language plpgsql security definer
set search_path = public
as $$
declare
  v_cost       int;
  v_card_ids   int[];
begin
  v_cost := case p_pack_type
    when 'random_release' then 50
    when 'same_release'   then 100
    else null
  end;
  if v_cost is null then
    raise exception 'unknown pack type: %', p_pack_type;
  end if;

  if p_pack_type = 'same_release' and p_release_id is null then
    raise exception 'release_id required for same_release pack';
  end if;

  perform 1 from players where id = p_player_id for update;

  if (select coins from players where id = p_player_id) < v_cost then
    raise exception 'insufficient_coins';
  end if;

  select array_agg(c.id) into v_card_ids
  from (
    select c.id
    from cards c
    join releases r on r.id = c.release_id
    where not exists (
      select 1 from player_cards pc
      where pc.player_id = p_player_id and pc.card_id = c.id
    )
    and (
      (not r.private)
      or exists (
        select 1 from player_release_access pra
        where pra.player_id = p_player_id and pra.release_id = r.id
      )
    )
    and (p_pack_type = 'random_release' or r.id = p_release_id)
    order by random()
    limit 3
  ) c;

  if v_card_ids is null or array_length(v_card_ids, 1) < 3 then
    raise exception 'no_unowned_cards';
  end if;

  update players set coins = coins - v_cost where id = p_player_id;

  insert into player_cards (player_id, card_id)
  select p_player_id, unnest(v_card_ids)
  on conflict do nothing;

  -- Check achievements after card ownership changes; don't let it abort the pack open
  begin
    perform check_achievements(p_player_id);
  exception when others then null;
  end;

  return query
    select c.id, c.name, c.type, c.art_emoji, c.art_url, c.flavor_text, c.release_id
    from cards c
    where c.id = any(v_card_ids);
end;
$$;

revoke execute on function open_pack from public, anon, authenticated;
grant  execute on function open_pack to service_role;
