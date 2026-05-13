-- Campaign / Story Mode
-- Requires: players table

-- ── Tables ──────────────────────────────────────────────────────────────────

create table campaign_arcs (
  id          serial primary key,
  title       text not null,
  theme_emoji text not null,
  sort_order  int  not null,
  badge_emoji text not null,
  badge_name  text not null,
  badge_description text not null
);

create table campaign_chapters (
  id               serial primary key,
  arc_id           int  not null references campaign_arcs(id),
  sort_order       int  not null,
  title            text not null,
  ai_opponent_name text not null,
  ai_difficulty    text not null check(ai_difficulty in ('easy','normal','hard','expert')),
  narrative_intro  text not null,
  narrative_outro_win  text not null,
  narrative_outro_loss text not null,
  xp_reward        int  not null default 75,
  win_condition    text not null default 'win' check(win_condition in ('win','win_by_margin')),
  win_param        int
);

create table player_campaign_progress (
  player_id    uuid not null references players(id) on delete cascade,
  chapter_id   int  not null references campaign_chapters(id),
  completed_at timestamptz not null default now(),
  winner       text not null,
  player_score int  not null,
  opponent_score int not null,
  primary key (player_id, chapter_id)
);

alter table campaign_arcs enable row level security;
alter table campaign_chapters enable row level security;
alter table player_campaign_progress enable row level security;

create policy "anyone reads arcs"     on campaign_arcs     for select using (true);
create policy "anyone reads chapters" on campaign_chapters for select using (true);
create policy "player sees own progress"
  on player_campaign_progress for select using (player_id = auth.uid());

-- ── complete_campaign_chapter ────────────────────────────────────────────────

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
      or (v_chapter.win_condition = 'win_by_margin' and v_margin >= v_chapter.win_param)
    );

  if not exists (
    select 1 from public.player_campaign_progress
    where player_id = v_player_id and chapter_id = p_chapter_id
  ) then
    insert into public.player_campaign_progress
      (player_id, chapter_id, winner, player_score, opponent_score)
    values
      (v_player_id, p_chapter_id, p_winner, p_player_score, p_opponent_score);

    if v_chapter_passed then
      v_xp_awarded := v_chapter.xp_reward;
      update public.players set xp = xp + v_xp_awarded where id = v_player_id;

      select count(*) into v_arc_chapter_count
      from public.campaign_chapters where arc_id = v_chapter.arc_id;

      select count(*) into v_completed_count
      from public.player_campaign_progress pcp
      join public.campaign_chapters cc on cc.id = pcp.chapter_id
      where pcp.player_id = v_player_id
        and cc.arc_id = v_chapter.arc_id;

      v_arc_completed := (v_completed_count >= v_arc_chapter_count);
    end if;
  end if;

  return jsonb_build_object(
    'chapter_passed', v_chapter_passed,
    'xp_awarded',     v_xp_awarded,
    'arc_completed',  v_arc_completed,
    'badge_emoji',    case when v_arc_completed then v_chapter.badge_emoji else null end,
    'badge_name',     case when v_arc_completed then v_chapter.badge_name else null end
  );
end;
$$;

revoke execute on function complete_campaign_chapter(int, text, int, int) from public, anon;
grant  execute on function complete_campaign_chapter(int, text, int, int) to authenticated, service_role;

-- ── Seed data ────────────────────────────────────────────────────────────────

insert into public.campaign_arcs (title, theme_emoji, sort_order, badge_emoji, badge_name, badge_description)
values
  ('The Mathemagic Academy', '🎓', 1,
   '🏫', 'Academy Graduate',
   'Defeated all five instructors at Mathemagic Academy.'),
  ('The Wild Kingdom', '🌿', 2,
   '🦁', 'Wildlife Champion',
   'Conquered the Wild Kingdom from forest to lion''s den.');

insert into public.campaign_chapters
  (arc_id, sort_order, title, ai_opponent_name, ai_difficulty,
   narrative_intro, narrative_outro_win, narrative_outro_loss,
   xp_reward, win_condition, win_param)
values
  (1, 1, 'First Day',
   'Prof. Sprout', 'easy',
   'Welcome to Mathemagic Academy! Professor Sprout runs the introductory class. She''s kind, but don''t let that fool you — she expects you to show basic mastery. Win any game to advance.',
   'Well done! Professor Sprout nods approvingly. "A promising start," she says, stamping your enrolment card.',
   'Hmm. Professor Sprout gives you an encouraging smile. "Chin up — every expert was a beginner once. Try again!"',
   50, 'win', null),

  (1, 2, 'Times Table Test',
   'Librarian Lorn', 'easy',
   'Librarian Lorn guards the Academy archives. She''ll only grant you access to the upper floors if you prove real numerical dominance. Win by at least 10 points to pass.',
   'Lorn slides the key across the desk without a word. You''ve earned your library card.',
   'Lorn sighs and reshuffles her cards. "The margin matters as much as the outcome. Come back when you''re ready."',
   60, 'win_by_margin', 10),

  (1, 3, 'Field Day Challenge',
   'Coach Kim', 'normal',
   'Coach Kim believes in fair competition and balanced decks. She plays the Normal difficulty — expect smarter card choices. Just win to earn your Field Day ribbon.',
   'Coach Kim gives you a firm handshake. "That''s the spirit. You''ve earned your ribbon — and my respect."',
   'Coach Kim blows her whistle. "Good hustle! But hustle alone won''t cut it. Back to practice."',
   75, 'win', null),

  (1, 4, 'Science Fair Showdown',
   'Dr. Watts', 'normal',
   'Dr. Watts runs the Science Fair with precision. He expects not just victory, but an impressive margin of at least 15 points. Anything less and he''ll send you back to the lab.',
   'Dr. Watts scribbles a note in his ledger. "Statistically significant result. Outstanding work."',
   'Dr. Watts taps his pencil. "Promising, but the error bars are too large. Improve your score differential."',
   80, 'win_by_margin', 15),

  (1, 5, 'Graduation Day',
   'Principal Pascal', 'hard',
   'The final exam. Principal Pascal himself steps up to the board. He plays Hard — precise, methodical, and formidable. Win to graduate from Mathemagic Academy.',
   'The hall erupts in applause. Principal Pascal shakes your hand: "Mathemagic Academy is proud to call you a graduate."',
   'Principal Pascal straightens his tie. "Impressive showing, but not quite graduation-ready. The Academy demands excellence."',
   100, 'win', null),

  (2, 1, 'Into the Forest',
   'Forest Fox', 'normal',
   'You venture into the Wild Kingdom. The Forest Fox is your first test — clever and unpredictable, playing Normal difficulty. Outwit it to continue deeper into the wilderness.',
   'The fox vanishes into the undergrowth with a flick of its tail. The forest path ahead is yours.',
   'The fox circles you with a knowing grin. "The forest isn''t done with you yet." Regroup and try again.',
   75, 'win', null),

  (2, 2, 'River Crossing',
   'River Pike', 'normal',
   'A mighty pike blocks the river crossing. It demands a tribute of superior mathematics — win by at least 15 points, or be turned back by the current.',
   'The pike glides aside, revealing the ford. You cross into deeper territory.',
   'The pike splashes water at your feet. "Not enough — the current won''t carry a weak hand." Try again.',
   80, 'win_by_margin', 15),

  (2, 3, 'Mountain Summit',
   'Mountain Eagle', 'hard',
   'An eagle surveys its mountain from above, playing Hard difficulty. It strikes with precision. Defeat it to claim the summit and descend to the jungle below.',
   'The eagle screams once, then soars skyward — its domain acknowledged. The descent begins.',
   'The eagle banks away, unimpressed. "The summit belongs to those who earn it." Climb again.',
   100, 'win', null),

  (2, 4, 'Jungle Depths',
   'Jungle Panther', 'hard',
   'The panther rules the jungle floor. Hard difficulty, and it will only stand aside for someone who proves dominance by a margin of at least 20 points. Anything less and the jungle keeps you.',
   'The panther melts into the shadows. The path to the lion''s den is finally open.',
   'The panther holds its ground. "Dominance requires more than winning — it requires commanding." Try again.',
   110, 'win_by_margin', 20),

  (2, 5, 'The Lion''s Den',
   'Pride Lion', 'expert',
   'The apex predator of the Wild Kingdom. Pride Lion plays Expert — the hardest AI available. Only a true Wildlife Champion can defeat it. There are no score conditions — you simply must win.',
   'The lion bows its great head. In the Wild Kingdom, there is no higher honour. You are the Wildlife Champion.',
   'The lion yawns, utterly unimpressed. "Return when you have earned the title." The challenge remains open.',
   150, 'win', null);
