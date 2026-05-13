-- Daily Quests
-- Requires: players table, check_achievements function (from achievements migration)

-- ── Tables ─────────────────────────────────────────────────────────────────

create table quest_definitions (
  id             serial primary key,
  key            text   unique not null,
  name           text   not null,
  description    text   not null,
  icon_emoji     text   not null,
  xp_reward      int    not null default 25,
  difficulty     text   not null check (difficulty in ('easy', 'medium', 'hard')),
  condition_type text   not null,
  condition_json jsonb  not null default '{}'
);

create table player_daily_quests (
  id           uuid        primary key default gen_random_uuid(),
  player_id    uuid        not null references players(id) on delete cascade,
  quest_id     int         not null references quest_definitions(id),
  quest_date   date        not null default (now() at time zone 'utc')::date,
  completed    boolean     not null default false,
  completed_at timestamptz,
  xp_awarded   boolean     not null default false,
  unique(player_id, quest_date, quest_id)
);

alter table player_daily_quests enable row level security;
create policy "player sees own daily quests"
  on player_daily_quests for select
  using (player_id = auth.uid());

-- ── Quest definitions (22 quests: 7 easy / 8 medium / 7 hard) ─────────────

insert into quest_definitions (key, name, description, icon_emoji, xp_reward, difficulty, condition_type, condition_json) values
  -- Easy (xp_reward 25)
  ('play_a_game',        'Just Play',           'Complete any game against the AI.',                         '🎮', 25,  'easy',   'always',              '{}'),
  ('win_a_game',         'First Blood',         'Win any game against the AI.',                              '🏆', 25,  'easy',   'win',                 '{}'),
  ('beat_easy_ai',       'Warm-Up',             'Beat the Easy AI.',                                         '😌', 25,  'easy',   'beat_difficulty',     '{"difficulty":"easy"}'),
  ('win_by_10',          'Decisive Victory',    'Win by 10 or more points.',                                 '📈', 25,  'easy',   'win_by_margin',       '{"margin":10}'),
  ('win_3_creatures',    'Pack Leader',         'Win with 3 or more creatures on your field.',               '🐾', 25,  'easy',   'win_creature_count',  '{"count":3}'),
  ('custom_deck_game',   'My Deck',             'Play any game using a custom-built deck.',                  '🃏', 25,  'easy',   'custom_deck_game',    '{}'),
  ('score_over_50',      'Half-Century',        'Achieve a score of 50 or more (any outcome).',              '🔢', 25,  'easy',   'any_score',           '{"score":50}'),
  -- Medium (xp_reward 50)
  ('beat_normal_ai',     'Steady Hand',         'Beat the Normal AI.',                                       '🧮', 50,  'medium', 'beat_difficulty',     '{"difficulty":"normal"}'),
  ('beat_hard_ai',       'Hard Knocks',         'Beat the Hard AI.',                                         '💪', 50,  'medium', 'beat_difficulty',     '{"difficulty":"hard"}'),
  ('win_by_20',          'Dominant',            'Win by 20 or more points.',                                 '🚀', 50,  'medium', 'win_by_margin',       '{"margin":20}'),
  ('win_4_creatures',    'Field Commander',     'Win with 4 or more creatures on your field.',               '⚔️',  50,  'medium', 'win_creature_count',  '{"count":4}'),
  ('win_score_50',       'Golden Score',        'Win a game with a score of 50 or more.',                    '🌟', 50,  'medium', 'win_score',           '{"score":50}'),
  ('custom_deck_win',    'Deck Master',         'Win using a custom-built deck.',                            '✨', 50,  'medium', 'custom_deck_win',     '{}'),
  ('all_one_release',    'Pure Collection',     'Win with all your field creatures from the same release.',  '📚', 50,  'medium', 'all_one_release',     '{}'),
  ('score_over_100',     'Triple Digits',       'Achieve a score of 100 or more (any outcome).',             '💯', 50,  'medium', 'any_score',           '{"score":100}'),
  -- Hard (xp_reward 100)
  ('beat_expert_ai',     'Expert Slayer',       'Beat the Expert AI.',                                       '🔥', 100, 'hard',   'beat_difficulty',     '{"difficulty":"expert"}'),
  ('challenge_expert',   'Brave Soul',          'Play a game against the Expert AI.',                        '😤', 100, 'hard',   'challenge_difficulty','{"difficulty":"expert"}'),
  ('win_by_30',          'Crushing Blow',       'Win by 30 or more points.',                                 '💥', 100, 'hard',   'win_by_margin',       '{"margin":30}'),
  ('win_all_5',          'Full Field',          'Win with all 5 creatures on your field.',                   '🌈', 100, 'hard',   'win_creature_count',  '{"count":5}'),
  ('win_score_100',      'Centurion',           'Win a game with a score of 100 or more.',                   '🏅', 100, 'hard',   'win_score',           '{"score":100}'),
  ('dominant_win',       'Shutout',             'Win while your opponent scores 0 or less.',                 '🥶', 100, 'hard',   'dominant_win',        '{}'),
  ('multi_release_win',  'Collector''s Pride',  'Win with creatures from 3 or more different releases.',     '🎨', 100, 'hard',   'multi_release_win',   '{"count":3}');

-- ── award_solo_win / award_solo_tie / award_solo_loss ───────────────────────
-- Award XP/coins/stats for solo AI game completions (no opponent player_id).

create or replace function award_solo_win(p_player_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set coins        = coins + 15,
      xp           = xp + 50,
      games_won    = games_won + 1,
      games_played = games_played + 1
  where id = p_player_id;

  begin
    perform public.check_achievements(p_player_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_player_id, sqlerrm, sqlstate;
  end;
end;
$$;

create or replace function award_solo_tie(p_player_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set coins        = coins + 5,
      xp           = xp + 25,
      games_played = games_played + 1
  where id = p_player_id;

  begin
    perform public.check_achievements(p_player_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_player_id, sqlerrm, sqlstate;
  end;
end;
$$;

create or replace function award_solo_loss(p_player_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  update public.players
  set coins        = coins + 2,
      xp           = xp + 15,
      games_played = games_played + 1
  where id = p_player_id;

  begin
    perform public.check_achievements(p_player_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_player_id, sqlerrm, sqlstate;
  end;
end;
$$;

revoke execute on function award_solo_win(uuid)  from public, anon, authenticated;
revoke execute on function award_solo_tie(uuid)  from public, anon, authenticated;
revoke execute on function award_solo_loss(uuid) from public, anon, authenticated;
grant  execute on function award_solo_win(uuid)  to service_role;
grant  execute on function award_solo_tie(uuid)  to service_role;
grant  execute on function award_solo_loss(uuid) to service_role;

-- ── draw_daily_quests ───────────────────────────────────────────────────────
-- Idempotent: returns today's quests, creating them if this is the first call today.
-- Returns 3 rows: 1 easy, 1 medium, 1 hard, ordered by difficulty.

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
    select id into v_easy
    from public.quest_definitions
    where difficulty = 'easy'
    order by random()
    limit 1;

    select id into v_medium
    from public.quest_definitions
    where difficulty = 'medium'
    order by random()
    limit 1;

    select id into v_hard
    from public.quest_definitions
    where difficulty = 'hard'
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

-- ── check_daily_quests ──────────────────────────────────────────────────────
-- Called server-side (service_role) after a solo AI game completes.
-- game_context jsonb shape:
--   winner:           'player' | 'opponent' | 'tie'
--   player_score:     number
--   opponent_score:   number
--   ai_difficulty:    'easy' | 'normal' | 'hard' | 'expert'
--   custom_deck_id:   text | null
--   field_release_ids: number[]  (release_id of each creature on player's final field)
--   field_count:      number
-- Returns: array of quest keys newly completed this call.

create or replace function check_daily_quests(p_player_id uuid, game_context jsonb)
returns text[]
language plpgsql security definer
set search_path = ''
as $$
declare
  v_today         date    := (now() at time zone 'utc')::date;
  v_winner        text    := game_context->>'winner';
  v_player_score  int     := (game_context->>'player_score')::int;
  v_opp_score     int     := (game_context->>'opponent_score')::int;
  v_difficulty    text    := game_context->>'ai_difficulty';
  v_custom_deck   text    := game_context->>'custom_deck_id';
  v_field_count   int     := (game_context->>'field_count')::int;
  v_release_ids   int[];
  v_is_win        boolean := v_winner = 'player';
  v_margin        int     := v_player_score - v_opp_score;
  v_distinct_rels int;
  v_all_same_rel  boolean;
  v_row           record;
  v_met           boolean;
  v_completed     text[]  := '{}';
begin
  -- Parse field_release_ids from jsonb array
  select array_agg(e::int)
  into v_release_ids
  from jsonb_array_elements_text(game_context->'field_release_ids') e;

  if v_release_ids is not null and array_length(v_release_ids, 1) > 0 then
    select count(distinct r) into v_distinct_rels from unnest(v_release_ids) r;
    v_all_same_rel := (v_distinct_rels = 1);
  else
    v_distinct_rels := 0;
    v_all_same_rel  := false;
  end if;

  -- Iterate incomplete quests for today
  for v_row in
    select pdq.id, pdq.quest_id, qd.key, qd.condition_type, qd.condition_json, qd.xp_reward
    from public.player_daily_quests pdq
    join public.quest_definitions qd on qd.id = pdq.quest_id
    where pdq.player_id  = p_player_id
      and pdq.quest_date = v_today
      and pdq.completed  = false
  loop
    v_met := case v_row.condition_type
      when 'always'               then true
      when 'win'                  then v_is_win
      when 'beat_difficulty'      then v_is_win and v_difficulty = (v_row.condition_json->>'difficulty')
      when 'challenge_difficulty' then v_difficulty = (v_row.condition_json->>'difficulty')
      when 'win_by_margin'        then v_is_win and v_margin >= (v_row.condition_json->>'margin')::int
      when 'win_score'            then v_is_win and v_player_score >= (v_row.condition_json->>'score')::int
      when 'any_score'            then v_player_score >= (v_row.condition_json->>'score')::int
      when 'win_creature_count'   then v_is_win and v_field_count >= (v_row.condition_json->>'count')::int
      when 'custom_deck_game'     then v_custom_deck is not null
      when 'custom_deck_win'      then v_is_win and v_custom_deck is not null
      when 'all_one_release'      then v_is_win and v_all_same_rel
      when 'dominant_win'         then v_is_win and v_opp_score <= 0
      when 'multi_release_win'    then v_is_win and v_distinct_rels >= (v_row.condition_json->>'count')::int
      else false
    end;

    if v_met then
      update public.player_daily_quests
      set completed    = true,
          completed_at = now(),
          xp_awarded   = true
      where id = v_row.id
        and completed = false;

      if found then
        update public.players
        set xp = xp + v_row.xp_reward
        where id = p_player_id;

        v_completed := v_completed || v_row.key;
      end if;
    end if;
  end loop;

  return v_completed;
end;
$$;

revoke execute on function check_daily_quests(uuid, jsonb) from public, anon, authenticated;
grant  execute on function check_daily_quests(uuid, jsonb) to service_role;
