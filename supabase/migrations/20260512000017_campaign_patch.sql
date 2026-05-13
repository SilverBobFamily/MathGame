-- Patch: fix campaign arc completion and win_param null safety

-- Add 'passed' column to track chapter-level pass/fail
alter table player_campaign_progress add column passed boolean not null default false;

-- Prevent win_by_margin chapters from having null win_param
alter table campaign_chapters
  add constraint campaign_chapters_win_param_check
  check (win_condition = 'win' or win_param is not null);

-- Replace complete_campaign_chapter with corrected version
create or replace function complete_campaign_chapter(
  p_chapter_id   int,
  p_winner       text,
  p_player_score int,
  p_opponent_score int
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_player_id     uuid := auth.uid();
  v_chapter       record;
  v_margin        int;
  v_chapter_passed boolean;
  v_xp_awarded    int := 0;
  v_arc_completed boolean := false;
  v_completed_count int;
  v_arc_chapter_count int;
begin
  if v_player_id is null then
    raise exception 'unauthorized';
  end if;

  select c.*, a.id as arc_id_val, a.badge_emoji, a.badge_name
  into v_chapter
  from public.campaign_chapters c
  join public.campaign_arcs a on a.id = c.arc_id
  where c.id = p_chapter_id;

  if not found then
    raise exception 'chapter_not_found';
  end if;

  v_margin := p_player_score - p_opponent_score;
  v_chapter_passed :=
    p_winner = 'player' and (
      v_chapter.win_condition = 'win'
      or (v_chapter.win_condition = 'win_by_margin'
          and v_chapter.win_param is not null
          and v_margin >= v_chapter.win_param)
    );

  if not exists (
    select 1 from public.player_campaign_progress
    where player_id = v_player_id and chapter_id = p_chapter_id
  ) then
    insert into public.player_campaign_progress
      (player_id, chapter_id, winner, player_score, opponent_score, passed)
    values
      (v_player_id, p_chapter_id, p_winner, p_player_score, p_opponent_score, v_chapter_passed);

    if v_chapter_passed then
      v_xp_awarded := v_chapter.xp_reward;
      update public.players set xp = xp + v_xp_awarded where id = v_player_id;

      -- Count only PASSED chapters in the arc
      select count(*) into v_arc_chapter_count
      from public.campaign_chapters where arc_id = v_chapter.arc_id;

      select count(*) into v_completed_count
      from public.player_campaign_progress pcp
      join public.campaign_chapters cc on cc.id = pcp.chapter_id
      where pcp.player_id = v_player_id
        and cc.arc_id = v_chapter.arc_id
        and pcp.passed = true;

      v_arc_completed := (v_completed_count >= v_arc_chapter_count);
    end if;
  end if;

  return jsonb_build_object(
    'chapter_passed', coalesce(v_chapter_passed, false),
    'xp_awarded',     v_xp_awarded,
    'arc_completed',  v_arc_completed,
    'badge_emoji',    case when v_arc_completed then v_chapter.badge_emoji else null end,
    'badge_name',     case when v_arc_completed then v_chapter.badge_name else null end
  );
end;
$$;

revoke execute on function complete_campaign_chapter(int, text, int, int) from public, anon;
grant  execute on function complete_campaign_chapter(int, text, int, int) to authenticated, service_role;
