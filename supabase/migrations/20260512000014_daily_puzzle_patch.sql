-- Patch: fix submit_puzzle_answer race condition and add daily_puzzles RLS

alter table daily_puzzles enable row level security;

create or replace function submit_puzzle_answer(
  p_puzzle_id              int,
  p_submitted_card_id      int,
  p_submitted_target_side  text,
  p_submitted_creature_id  int default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_today        date := (now() at time zone 'utc')::date;
  v_player_id    uuid := auth.uid();
  v_puzzle       record;
  v_is_correct   boolean;
  v_xp_reward    int;
begin
  if v_player_id is null then
    raise exception 'unauthorized';
  end if;

  if exists (
    select 1 from public.player_puzzle_attempts
    where player_id = v_player_id
      and puzzle_id = p_puzzle_id
      and attempted_date = v_today
  ) then
    return jsonb_build_object('already_attempted', true, 'is_correct', null, 'xp_awarded', 0);
  end if;

  select solution_card_id, solution_target_side, solution_target_creature_id, xp_reward
  into v_puzzle
  from public.daily_puzzles where id = p_puzzle_id;

  if not found then
    raise exception 'puzzle_not_found';
  end if;

  v_is_correct :=
    p_submitted_card_id = v_puzzle.solution_card_id
    and p_submitted_target_side = v_puzzle.solution_target_side
    and (
      v_puzzle.solution_target_creature_id is null
      or p_submitted_creature_id = v_puzzle.solution_target_creature_id
    );

  v_xp_reward := case when v_is_correct then v_puzzle.xp_reward else 10 end;

  insert into public.player_puzzle_attempts
    (player_id, puzzle_id, attempted_date, is_correct, xp_awarded)
  values
    (v_player_id, p_puzzle_id, v_today, v_is_correct, true)
  on conflict (player_id, puzzle_id, attempted_date) do nothing;

  if not found then
    return jsonb_build_object('already_attempted', true, 'is_correct', null, 'xp_awarded', 0);
  end if;

  update public.players
  set xp = xp + v_xp_reward
  where id = v_player_id;

  return jsonb_build_object(
    'already_attempted', false,
    'is_correct',        v_is_correct,
    'xp_awarded',        v_xp_reward
  );
end;
$$;

revoke execute on function submit_puzzle_answer(int, int, text, int) from public, anon;
grant  execute on function submit_puzzle_answer(int, int, text, int) to authenticated, service_role;
