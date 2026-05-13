-- Fix ambiguous "id" column reference in draw_daily_quests.
-- When a PL/pgSQL function has RETURNS TABLE(id uuid, ...), "id" becomes an
-- implicit OUT parameter that shadows unqualified column references. Qualify
-- each quest_definitions.id lookup with a table alias to remove the ambiguity.

create or replace function draw_daily_quests(p_player_id uuid)
returns table(
  id           uuid,
  quest_id     int,
  key          text,
  name         text,
  description  text,
  icon_emoji   text,
  xp_reward    int,
  difficulty   text,
  completed    boolean,
  completed_at timestamptz
)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_today  date := (now() at time zone 'utc')::date;
  v_count  int;
  v_easy   int;
  v_medium int;
  v_hard   int;
begin
  select count(*) into v_count
  from public.player_daily_quests
  where player_id = p_player_id and quest_date = v_today;

  if v_count = 0 then
    select qd.id into v_easy
    from public.quest_definitions qd
    where qd.difficulty = 'easy'
    order by random()
    limit 1;

    select qd.id into v_medium
    from public.quest_definitions qd
    where qd.difficulty = 'medium'
    order by random()
    limit 1;

    select qd.id into v_hard
    from public.quest_definitions qd
    where qd.difficulty = 'hard'
    order by random()
    limit 1;

    insert into public.player_daily_quests (player_id, quest_id, quest_date)
    values
      (p_player_id, v_easy,   v_today),
      (p_player_id, v_medium, v_today),
      (p_player_id, v_hard,   v_today)
    on conflict (player_id, quest_date, quest_id) do nothing;
  end if;

  return query
    select
      pdq.id,
      pdq.quest_id,
      qd.key,
      qd.name,
      qd.description,
      qd.icon_emoji,
      qd.xp_reward,
      qd.difficulty,
      pdq.completed,
      pdq.completed_at
    from public.player_daily_quests pdq
    join public.quest_definitions qd on qd.id = pdq.quest_id
    where pdq.player_id = p_player_id
      and pdq.quest_date = v_today
    order by
      case qd.difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 end;
end;
$$;

revoke execute on function draw_daily_quests(uuid) from public, anon;
grant  execute on function draw_daily_quests(uuid) to authenticated, service_role;
