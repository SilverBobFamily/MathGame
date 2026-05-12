-- Interactive Tutorial
-- Adds tutorial_completed to players.
-- Adds Graduate achievement (not auto-granted; condition_value=999999 sentinel).
-- Adds award_tutorial_completion() RPC called by /api/tutorial/complete.

alter table players
  add column if not exists tutorial_completed boolean not null default false;

insert into achievement_definitions
  (key, name, description, icon_emoji, xp_reward, condition_type, condition_value)
values
  ('tutorial_complete', 'Graduate', 'Complete the interactive tutorial.', '🎓', 50, 'games_played', 999999)
on conflict (key) do nothing;

create or replace function award_tutorial_completion(p_player_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_ach_id int;
begin
  if (select tutorial_completed from players where id = p_player_id) then
    raise exception 'already_complete';
  end if;

  update players set
    tutorial_completed = true,
    xp = xp + 50
  where id = p_player_id;

  select id into v_ach_id
  from achievement_definitions
  where key = 'tutorial_complete';

  if v_ach_id is not null then
    insert into player_achievements (player_id, achievement_id)
    values (p_player_id, v_ach_id)
    on conflict (player_id, achievement_id) do nothing;
  end if;
end;
$$;

revoke execute on function award_tutorial_completion from public, anon, authenticated;
grant  execute on function award_tutorial_completion to service_role;
