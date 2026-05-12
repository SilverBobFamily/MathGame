-- Achievements / Badges
-- Requires: players.xp (from remote migration), player_cards (from remote migration)

create table achievement_definitions (
  id               serial primary key,
  key              text unique not null,
  name             text not null,
  description      text not null,
  icon_emoji       text not null,
  xp_reward        int  not null default 25,
  condition_type   text not null check (condition_type in ('games_played','games_won','xp','coins','owned_cards')),
  condition_value  int  not null
);

create table player_achievements (
  player_id       uuid not null references players(id) on delete cascade,
  achievement_id  int  not null references achievement_definitions(id),
  unlocked_at     timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

alter table player_achievements enable row level security;
create policy "player_achievements: public read"
  on player_achievements for select using (true);

insert into achievement_definitions (key, name, description, icon_emoji, xp_reward, condition_type, condition_value) values
  ('first_game',        'First Steps',         'Play your first game.',           '🎮', 25,  'games_played', 1),
  ('games_played_10',   'Dedicated',           'Play 10 games.',                  '📅', 50,  'games_played', 10),
  ('games_played_25',   'All-Rounder',         'Play 25 games.',                  '🎯', 75,  'games_played', 25),
  ('games_played_50',   'Veteran',             'Play 50 games.',                  '🏅', 100, 'games_played', 50),
  ('games_played_100',  'Marathon Runner',     'Play 100 games.',                 '🏃', 200, 'games_played', 100),
  ('first_win',         'First Win',           'Win your first game.',            '🏆', 25,  'games_won',    1),
  ('wins_3',            'Hat Trick',           'Win 3 games.',                    '🎩', 25,  'games_won',    3),
  ('wins_10',           'Decade',              'Win 10 games.',                   '💫', 50,  'games_won',    10),
  ('wins_50',           'Champion',            'Win 50 games.',                   '🥇', 100, 'games_won',    50),
  ('wins_100',          'Legend',              'Win 100 games.',                  '👑', 200, 'games_won',    100),
  ('xp_50',             'Rising Star',         'Earn 50 XP.',                     '⭐', 25,  'xp',           50),
  ('xp_750',            'Arithmancer',         'Earn 750 XP.',                    '🔮', 50,  'xp',           750),
  ('xp_2250',           'Grand Multiplier',    'Earn 2250 XP.',                   '✨', 100, 'xp',           2250),
  ('xp_15000',          'Mathemagician',       'Earn 15000 XP.',                  '🌟', 200, 'xp',           15000),
  ('cards_5',           'Starter Collection',  'Own at least 5 cards.',           '🃏', 25,  'owned_cards',  5),
  ('cards_20',          'Growing Collection',  'Own at least 20 cards.',          '📦', 50,  'owned_cards',  20),
  ('cards_50',          'Hoarder',             'Own at least 50 cards.',          '🗃️', 100, 'owned_cards',  50),
  ('cards_100',         'Card Master',         'Own at least 100 cards.',         '📚', 200, 'owned_cards',  100),
  ('coins_250',         'Wealthy',             'Hold 250 coins at once.',         '🪙', 25,  'coins',        250),
  ('coins_1000',        'Tycoon',              'Hold 1000 coins at once.',        '💰', 50,  'coins',        1000);

create or replace function check_achievements(p_player_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_games_played  int;
  v_games_won     int;
  v_xp            int;
  v_coins         int;
  v_owned_cards   bigint;
  v_def           record;
  v_met           boolean;
begin
  select games_played, games_won, xp, coins
  into v_games_played, v_games_won, v_xp, v_coins
  from players
  where id = p_player_id;

  if not found then return; end if;

  select count(*) into v_owned_cards
  from player_cards
  where player_id = p_player_id;

  for v_def in select * from achievement_definitions loop
    v_met := case v_def.condition_type
      when 'games_played' then v_games_played >= v_def.condition_value
      when 'games_won'    then v_games_won    >= v_def.condition_value
      when 'xp'          then v_xp           >= v_def.condition_value
      when 'coins'       then v_coins        >= v_def.condition_value
      when 'owned_cards' then v_owned_cards  >= v_def.condition_value
      else false
    end;

    if v_met then
      -- ON CONFLICT DO NOTHING is the atomic guard against concurrent calls
      insert into player_achievements (player_id, achievement_id)
      values (p_player_id, v_def.id)
      on conflict (player_id, achievement_id) do nothing;

      if found then
        update players
        set xp = xp + v_def.xp_reward
        where id = p_player_id;

        -- Keep local var in sync so later iterations see the updated XP
        v_xp := v_xp + v_def.xp_reward;
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function check_achievements from public, anon, authenticated;
grant  execute on function check_achievements to service_role;

create or replace function get_player_achievements(p_player_id uuid)
returns table(
  id              int,
  key             text,
  name            text,
  description     text,
  icon_emoji      text,
  xp_reward       int,
  condition_type  text,
  condition_value int,
  unlocked_at     timestamptz
) language sql stable security definer
set search_path = public
as $$
  select
    d.id, d.key, d.name, d.description, d.icon_emoji, d.xp_reward,
    d.condition_type, d.condition_value,
    pa.unlocked_at
  from achievement_definitions d
  left join player_achievements pa
    on pa.achievement_id = d.id and pa.player_id = p_player_id
  order by d.id;
$$;

revoke execute on function get_player_achievements from public, anon;
grant  execute on function get_player_achievements to authenticated, service_role;

create or replace function award_win(p_winner_id uuid, p_loser_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update players set
    coins        = coins + 15,
    xp           = xp + 50,
    games_won    = games_won + 1,
    games_played = games_played + 1
  where id = p_winner_id;

  update players set
    coins        = coins + 2,
    xp           = xp + 15,
    games_played = games_played + 1
  where id = p_loser_id;

  -- Stat updates above must never be rolled back by an achievement error
  begin
    perform check_achievements(p_winner_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_winner_id, sqlerrm, sqlstate;
  end;
  begin
    perform check_achievements(p_loser_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_loser_id, sqlerrm, sqlstate;
  end;
end;
$$;

revoke execute on function award_win from public, anon, authenticated;
grant  execute on function award_win  to service_role;

create or replace function award_tie(p_player1_id uuid, p_player2_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update players set
    coins        = coins + 5,
    xp           = xp + 25,
    games_played = games_played + 1
  where id in (p_player1_id, p_player2_id);

  begin
    perform check_achievements(p_player1_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_player1_id, sqlerrm, sqlstate;
  end;
  begin
    perform check_achievements(p_player2_id);
  exception when others then
    raise warning 'check_achievements failed for player %: % %', p_player2_id, sqlerrm, sqlstate;
  end;
end;
$$;

revoke execute on function award_tie from public, anon, authenticated;
grant  execute on function award_tie  to service_role;

create index player_achievements_player_id_idx
  on player_achievements (player_id);
