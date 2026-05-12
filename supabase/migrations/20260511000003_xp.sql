-- supabase/migrations/20260511000003_xp.sql
-- Add XP column and update award functions to grant XP on game completion.

alter table players
  add column if not exists xp int not null default 0 check (xp >= 0);

-- Winner gets 50 XP, loser gets 15 XP.
create or replace function award_win(p_winner_id uuid, p_loser_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update players set
    coins        = coins + 10,
    games_won    = games_won + 1,
    games_played = games_played + 1,
    xp           = xp + 50
  where id = p_winner_id;

  update players set
    games_played = games_played + 1,
    xp           = xp + 15
  where id = p_loser_id;
end;
$$;

-- Both players get 25 XP for a tie.
create or replace function award_tie(p_player1_id uuid, p_player2_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update players set
    games_played = games_played + 1,
    xp           = xp + 25
  where id in (p_player1_id, p_player2_id);
end;
$$;
-- revoke/grant already established in 007_profiles_coins.sql; not repeated here.
