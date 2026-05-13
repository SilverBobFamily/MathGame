-- supabase/migrations/20260512000020_learning_stats.sql

create table public.player_learning_stats (
  player_id        uuid primary key references public.players(id) on delete cascade,
  total_attempted  integer not null default 0,
  total_correct    integer not null default 0,
  item_attempted   integer not null default 0,
  item_correct     integer not null default 0,
  action_attempted integer not null default 0,
  action_correct   integer not null default 0,
  updated_at       timestamptz not null default now()
);

alter table public.player_learning_stats enable row level security;

create policy "owner can read" on public.player_learning_stats
  for select to authenticated using (player_id = auth.uid());

create policy "owner can insert" on public.player_learning_stats
  for insert to authenticated with check (player_id = auth.uid());

create policy "owner can update" on public.player_learning_stats
  for update to authenticated using (player_id = auth.uid());

create or replace function public.record_learning_session(
  p_total_attempted  int,
  p_total_correct    int,
  p_item_attempted   int,
  p_item_correct     int,
  p_action_attempted int,
  p_action_correct   int
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_learning_stats (
    player_id, total_attempted, total_correct,
    item_attempted, item_correct,
    action_attempted, action_correct
  )
  values (
    auth.uid(),
    p_total_attempted, p_total_correct,
    p_item_attempted,  p_item_correct,
    p_action_attempted, p_action_correct
  )
  on conflict (player_id) do update set
    total_attempted  = public.player_learning_stats.total_attempted  + excluded.total_attempted,
    total_correct    = public.player_learning_stats.total_correct    + excluded.total_correct,
    item_attempted   = public.player_learning_stats.item_attempted   + excluded.item_attempted,
    item_correct     = public.player_learning_stats.item_correct     + excluded.item_correct,
    action_attempted = public.player_learning_stats.action_attempted + excluded.action_attempted,
    action_correct   = public.player_learning_stats.action_correct   + excluded.action_correct,
    updated_at       = now();
end;
$$;

revoke all on function public.record_learning_session(int,int,int,int,int,int) from public;
grant execute on function public.record_learning_session(int,int,int,int,int,int) to authenticated, service_role;
