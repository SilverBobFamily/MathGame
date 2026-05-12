-- Add winner_id to games (null for ties and in-progress games)
alter table games
  add column if not exists winner_id uuid references players(id) on delete set null;

-- get_leaderboard: returns top p_limit players ranked by wins.
-- For 'all' period: uses pre-aggregated games_won (accurate even for pre-migration games).
-- For 'week'/'month': counts winner_id entries in games within the period.
create or replace function get_leaderboard(
  p_period text default 'all',
  p_limit  int  default 50
)
returns table (
  rank         bigint,
  player_id    uuid,
  username     text,
  avatar_url   text,
  xp           int,
  wins         bigint,
  games_played bigint
)
language plpgsql security definer
set search_path = public
as $$
begin
  if p_period = 'all' then
    return query
    select
      row_number() over (order by p.games_won desc, p.xp desc),
      p.id,
      p.username,
      p.avatar_url,
      p.xp,
      p.games_won::bigint,
      p.games_played::bigint
    from players p
    where p.games_played > 0
    order by p.games_won desc, p.xp desc
    limit p_limit;
  else
    return query
    with wins_in_period as (
      select
        g.winner_id as pid,
        count(*) as win_count
      from games g
      where g.winner_id is not null
        and g.status = 'finished'
        and g.updated_at >= now() - case p_period
          when 'week'  then interval '7 days'
          when 'month' then interval '30 days'
          else interval '0'
        end
      group by g.winner_id
    )
    select
      row_number() over (order by w.win_count desc, p.xp desc),
      p.id,
      p.username,
      p.avatar_url,
      p.xp,
      w.win_count::bigint,
      p.games_played::bigint
    from players p
    join wins_in_period w on w.pid = p.id
    order by w.win_count desc, p.xp desc
    limit p_limit;
  end if;
end;
$$;

-- get_player_rank: returns rank+wins for one player in the given period.
-- Returns 0 rows if the player has no games_played (all) or no wins (week/month).
create or replace function get_player_rank(
  p_player_id uuid,
  p_period    text default 'all'
)
returns table (
  rank  bigint,
  wins  bigint
)
language plpgsql security definer
set search_path = public
as $$
begin
  if p_period = 'all' then
    return query
    with ranked as (
      select
        p.id,
        dense_rank() over (order by p.games_won desc, p.xp desc) as rnk,
        p.games_won::bigint as win_count
      from players p
      where p.games_played > 0
    )
    select r.rnk, r.win_count
    from ranked r
    where r.id = p_player_id;
  else
    return query
    with wins_in_period as (
      select
        g.winner_id as pid,
        count(*) as win_count
      from games g
      where g.winner_id is not null
        and g.status = 'finished'
        and g.updated_at >= now() - case p_period
          when 'week'  then interval '7 days'
          when 'month' then interval '30 days'
          else interval '0'
        end
      group by g.winner_id
    ),
    ranked as (
      select
        p.id,
        dense_rank() over (order by w.win_count desc, p.xp desc) as rnk,
        w.win_count::bigint
      from players p
      join wins_in_period w on w.pid = p.id
    )
    select r.rnk, r.win_count
    from ranked r
    where r.id = p_player_id;
  end if;
end;
$$;

-- Public leaderboard: allow anon and authenticated users to call these RPCs
grant execute on function get_leaderboard(text, int) to anon, authenticated;
grant execute on function get_player_rank(uuid, text) to anon, authenticated;
