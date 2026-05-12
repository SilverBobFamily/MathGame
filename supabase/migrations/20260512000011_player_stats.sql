-- get_player_stats: returns aggregate stats for a player.
-- Uses gaps-and-islands windowing to compute longest win streak.
create or replace function get_player_stats(p_player_id uuid)
returns table(longest_win_streak integer)
language sql stable security definer
set search_path = ''
as $$
  with ordered_games as (
    select
      (winner_id = p_player_id) is true as is_win,
      row_number() over (order by created_at, id) as rn
    from public.games
    where status = 'finished'
      and (player1_id = p_player_id or player2_id = p_player_id)
  ),
  groups as (
    select
      is_win,
      rn - row_number() over (partition by is_win order by rn) as grp
    from ordered_games
  ),
  streaks as (
    select count(*)::integer as len
    from groups
    where is_win
    group by grp
  )
  select coalesce(max(len), 0) as longest_win_streak
  from streaks;
$$;

grant execute on function get_player_stats(uuid) to authenticated;
