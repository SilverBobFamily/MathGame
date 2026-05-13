-- Daily Puzzle
-- Requires: players, cards tables

-- ── Tables ─────────────────────────────────────────────────────────────────

create table daily_puzzles (
  id                          serial primary key,
  rotation_index              int  unique not null,
  title                       text not null,
  description                 text not null,
  opponent_field_card_ids     int[] not null,
  player_field_card_ids       int[] not null,
  player_hand_card_ids        int[] not null,
  solution_card_id            int  not null references cards(id),
  solution_target_side        text not null default 'player'
    check(solution_target_side in ('player','opponent')),
  solution_target_creature_id int references cards(id),
  explanation                 text not null,
  xp_reward                   int  not null default 50
);

alter table daily_puzzles enable row level security;

create table player_puzzle_attempts (
  player_id      uuid not null references players(id) on delete cascade,
  puzzle_id      int  not null references daily_puzzles(id),
  attempted_date date not null default (now() at time zone 'utc')::date,
  is_correct     boolean not null,
  xp_awarded     boolean not null default false,
  attempted_at   timestamptz not null default now(),
  primary key (player_id, puzzle_id, attempted_date)
);

alter table player_puzzle_attempts enable row level security;
create policy "player sees own puzzle attempts"
  on player_puzzle_attempts for select using (player_id = auth.uid());

-- ── get_today_puzzle ────────────────────────────────────────────────────────

create or replace function get_today_puzzle()
returns table(
  id                          int,
  rotation_index              int,
  title                       text,
  description                 text,
  opponent_field_card_ids     int[],
  player_field_card_ids       int[],
  player_hand_card_ids        int[],
  solution_card_id            int,
  solution_target_side        text,
  solution_target_creature_id int,
  explanation                 text,
  xp_reward                   int
)
language sql stable security definer
set search_path = ''
as $$
  select
    dp.id,
    dp.rotation_index,
    dp.title,
    dp.description,
    dp.opponent_field_card_ids,
    dp.player_field_card_ids,
    dp.player_hand_card_ids,
    dp.solution_card_id,
    dp.solution_target_side,
    dp.solution_target_creature_id,
    dp.explanation,
    dp.xp_reward
  from public.daily_puzzles dp
  where dp.rotation_index = (
    floor(extract(epoch from (now() at time zone 'utc')) / 86400)::int
    % (select count(*)::int from public.daily_puzzles)
  );
$$;

revoke execute on function get_today_puzzle() from public, anon;
grant  execute on function get_today_puzzle() to authenticated, service_role;

-- ── submit_puzzle_answer ────────────────────────────────────────────────────

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

-- ── Seed 7 puzzles ─────────────────────────────────────────────────────────

do $$
declare
  hc1 int; hc2 int; hc3 int;
  mc1 int; mc2 int; mc3 int; mc4 int;
  lc1 int; lc2 int;
  nc1 int;
  ip1 int; ip2 int;
  am1 int; am2 int;
  ad1 int;
begin
  select id into hc1 from public.cards where type='creature' and value >= 7 order by release_id, id limit 1;
  select id into hc2 from public.cards where type='creature' and value >= 7 and id <> hc1 order by release_id, id limit 1;
  select id into hc3 from public.cards where type='creature' and value >= 7 and id not in (hc1,hc2) order by release_id, id limit 1;
  select id into mc1 from public.cards where type='creature' and value between 3 and 6 order by release_id, id limit 1;
  select id into mc2 from public.cards where type='creature' and value between 3 and 6 and id <> mc1 order by release_id, id limit 1;
  select id into mc3 from public.cards where type='creature' and value between 3 and 6 and id not in (mc1,mc2) order by release_id, id limit 1;
  select id into mc4 from public.cards where type='creature' and value between 3 and 6 and id not in (mc1,mc2,mc3) order by release_id, id limit 1;
  select id into lc1 from public.cards where type='creature' and value between 1 and 2 order by release_id, id limit 1;
  select id into lc2 from public.cards where type='creature' and value between 1 and 2 and id <> lc1 order by release_id, id limit 1;
  select id into nc1 from public.cards where type='creature' and value < 0 order by value, id limit 1;
  select id into ip1 from public.cards where type='item' and operator_value > 0 order by operator_value desc, id limit 1;
  select id into ip2 from public.cards where type='item' and operator_value > 0 and id <> ip1 order by operator_value desc, id limit 1;
  select id into am1 from public.cards where type='action' and operator like '×%' and operator_value > 1 order by operator_value desc, id limit 1;
  select id into am2 from public.cards where type='action' and operator like '×%' and operator_value > 1 and id <> am1 order by operator_value desc, id limit 1;
  select id into ad1 from public.cards where type='action' and operator like '÷%' order by id limit 1;

  if hc1 is null or hc2 is null or hc3 is null or mc1 is null or mc2 is null
     or mc3 is null or mc4 is null or am1 is null or ip1 is null then
    raise exception 'Insufficient card data to seed daily_puzzles. Ensure cards table is seeded first.';
  end if;

  insert into public.daily_puzzles
    (rotation_index, title, description,
     opponent_field_card_ids, player_field_card_ids, player_hand_card_ids,
     solution_card_id, solution_target_side, solution_target_creature_id,
     explanation, xp_reward)
  values
    (0, 'Double Down',
     'Opponent has a strong field. Pick the card that gives you the biggest score boost.',
     array[hc1, mc1], array[hc2], array[am1, mc2, lc1],
     am1, 'player', hc2,
     'The action multiplier applied to your high-value creature is far more powerful than adding a new creature.',
     75),
    (1, 'Best in Show',
     'Your field is empty. One card here wins it all.',
     array[mc1, mc2], array[]::int[], array[hc1, lc1, nc1],
     hc1, 'player', null,
     'Deploying your highest-value creature gives you an immediate score advantage over the opponent.',
     50),
    (2, 'The Right Tool',
     'You have a creature out. The opponent is slightly ahead. What one play closes the gap?',
     array[hc1, hc2], array[mc1], array[ip1, lc1, lc2],
     ip1, 'player', mc1,
     'Adding the item bonus to your existing creature is stronger than playing a low-value creature.',
     50),
    (3, 'Turn the Tables',
     'Opponent''s top creature is dominating. Which play helps YOU most?',
     array[hc1, mc2], array[hc3], array[am1, mc3, ip2],
     am1, 'player', hc3,
     'Multiplying your own high-value creature scores more than adding a smaller creature or a modest item.',
     75),
    (4, 'Pure Muscle',
     'No tricks today — just pick the strongest creature.',
     array[mc1, mc2, mc3], array[mc4], array[hc1, hc2, nc1],
     hc1, 'player', null,
     'The highest-value creature maximises your field score. The negative creature would hurt you.',
     50),
    (5, 'Mind the Minus',
     'Careful — not every card in your hand is helpful.',
     array[hc1, mc1], array[hc2, mc2], array[nc1, lc1, ip1],
     ip1, 'player', hc2,
     'The negative creature would lower your score. The item on your best creature is the winning play.',
     75),
    (6, 'Grand Multiplier',
     'One play can completely change the board. Which card has the highest potential?',
     array[hc1, hc2, mc1], array[mc2], array[am1, am2, lc1],
     am1, 'player', mc2,
     'The highest multiplier on your creature swings the score more than any other play available.',
     100);
end $$;
