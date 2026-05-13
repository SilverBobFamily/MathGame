# Campaign / Story Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 10 scripted single-player encounters across 2 themed arcs, each with named AI opponents, narrative blurbs, and XP rewards. First arc is fully playable end-to-end.

**Architecture:** Three new DB tables (`campaign_arcs`, `campaign_chapters`, `player_campaign_progress`) seeded with 10 chapters. A campaign hub page (`/campaign`) shows arcs and per-player progress. A play page (`/campaign/[chapterId]`) renders the intro → game → result flow: narrative intro first, then a full `GameBoardV2` AI game, then narrative outro with XP. The `/api/campaign/complete` route records progress and awards chapter XP (bonus on top of regular game XP). No changes to GameBoardV2 — we repurpose `onNewGame` to transition to the result phase and capture `state.winner` at that moment.

**Tech Stack:** Supabase SQL, Next.js App Router, React, TypeScript, existing GameBoardV2 and game engine.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260512000016_campaign.sql` | Create | Tables, seed 2 arcs + 10 chapters, RPCs |
| `lib/campaign.ts` | Create | Types + client helpers |
| `lib/__tests__/campaign.test.ts` | Create | Unit tests for isChapterUnlocked |
| `app/api/campaign/complete/route.ts` | Create | Record chapter completion, award XP |
| `app/api/campaign/complete/route.test.ts` | Create | Route error-map tests |
| `app/campaign/page.tsx` | Create | Campaign hub — arc + chapter list with progress |
| `app/campaign/[chapterId]/page.tsx` | Create | Campaign play page — intro → game → result |
| `components/NavBar.tsx` | Modify | Add Campaign nav link |

---

### Task 1: SQL Migration

**Files:**
- Create: `supabase/migrations/20260512000016_campaign.sql`

- [ ] **Step 1: Write the migration**

```sql
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
  win_param        int  -- required margin if win_condition='win_by_margin'
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
-- Idempotent per player+chapter. Awards XP only on first completion (win only).
-- Returns: { chapter_passed boolean, xp_awarded int, arc_completed boolean,
--            badge_emoji text, badge_name text }

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
  v_arc           record;
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

  -- Determine pass/fail
  v_margin := p_player_score - p_opponent_score;
  v_chapter_passed :=
    p_winner = 'player' and (
      v_chapter.win_condition = 'win'
      or (v_chapter.win_condition = 'win_by_margin' and v_margin >= v_chapter.win_param)
    );

  -- Record progress (first completion only)
  if not exists (
    select 1 from public.player_campaign_progress
    where player_id = v_player_id and chapter_id = p_chapter_id
  ) then
    insert into public.player_campaign_progress
      (player_id, chapter_id, winner, player_score, opponent_score)
    values
      (v_player_id, p_chapter_id, p_winner, p_player_score, p_opponent_score);

    -- Award XP only for first win
    if v_chapter_passed then
      v_xp_awarded := v_chapter.xp_reward;
      update public.players set xp = xp + v_xp_awarded where id = v_player_id;

      -- Check if entire arc is now complete
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
  -- Arc 1: The Mathemagic Academy
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

  -- Arc 2: The Wild Kingdom
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
```

- [ ] **Step 2: Apply the migration**

```bash
cd "/Users/josh/Desktop/Projects/Math Game"
npx supabase db push
```

Expected: migration applied.

- [ ] **Step 3: Commit**

```bash
cd "/Users/josh/Desktop/Projects/Math Game/.worktrees/feat-campaign"
git add supabase/migrations/20260512000016_campaign.sql
git commit -m "feat: add campaign migration — arcs, chapters, progress, complete_campaign_chapter RPC"
```

---

### Task 2: `lib/campaign.ts` + Tests

**Files:**
- Create: `lib/campaign.ts`
- Create: `lib/__tests__/campaign.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/campaign.test.ts`:

```typescript
import { isChapterUnlocked, type CampaignChapter } from '../campaign';

const ch = (id: number, sortOrder: number, arcId: number): CampaignChapter => ({
  id, arc_id: arcId, sort_order: sortOrder,
  title: `Ch${id}`, ai_opponent_name: 'Test', ai_difficulty: 'easy',
  narrative_intro: '', narrative_outro_win: '', narrative_outro_loss: '',
  xp_reward: 50, win_condition: 'win', win_param: null,
});

describe('isChapterUnlocked', () => {
  const chapters = [ch(1, 1, 1), ch(2, 2, 1), ch(3, 3, 1)];

  it('first chapter of any arc is always unlocked', () => {
    expect(isChapterUnlocked(chapters[0], new Set(), chapters)).toBe(true);
  });

  it('subsequent chapter requires previous to be completed', () => {
    expect(isChapterUnlocked(chapters[1], new Set(), chapters)).toBe(false);
    expect(isChapterUnlocked(chapters[1], new Set([1]), chapters)).toBe(true);
  });

  it('chapter 3 requires chapter 2 to be completed (not 1)', () => {
    expect(isChapterUnlocked(chapters[2], new Set([1]), chapters)).toBe(false);
    expect(isChapterUnlocked(chapters[2], new Set([2]), chapters)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
cd "/Users/josh/Desktop/Projects/Math Game/.worktrees/feat-campaign"
npx jest lib/__tests__/campaign.test.ts --no-coverage 2>&1 | tail -5
```

Expected: `Cannot find module '../campaign'`

- [ ] **Step 3: Write `lib/campaign.ts`**

```typescript
import { createSupabaseBrowserClient } from './supabase-browser';

export interface CampaignChapter {
  id: number;
  arc_id: number;
  sort_order: number;
  title: string;
  ai_opponent_name: string;
  ai_difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  narrative_intro: string;
  narrative_outro_win: string;
  narrative_outro_loss: string;
  xp_reward: number;
  win_condition: 'win' | 'win_by_margin';
  win_param: number | null;
}

export interface CampaignArc {
  id: number;
  title: string;
  theme_emoji: string;
  sort_order: number;
  badge_emoji: string;
  badge_name: string;
  badge_description: string;
  chapters: CampaignChapter[];
}

export function isChapterUnlocked(
  chapter: CampaignChapter,
  completedIds: Set<number>,
  allChapters: CampaignChapter[],
): boolean {
  const arcChapters = allChapters
    .filter(c => c.arc_id === chapter.arc_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const idx = arcChapters.findIndex(c => c.id === chapter.id);
  if (idx === 0) return true;
  return completedIds.has(arcChapters[idx - 1].id);
}

export async function getCampaignData(): Promise<CampaignArc[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: arcs, error: arcErr } = await supabase
    .from('campaign_arcs')
    .select('*')
    .order('sort_order');
  if (arcErr) throw new Error(arcErr.message);

  const { data: chapters, error: chErr } = await supabase
    .from('campaign_chapters')
    .select('*')
    .order('sort_order');
  if (chErr) throw new Error(chErr.message);

  return (arcs ?? []).map(arc => ({
    ...arc,
    chapters: (chapters ?? []).filter(c => c.arc_id === arc.id),
  }));
}

export async function getPlayerCampaignProgress(userId: string): Promise<Set<number>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('player_campaign_progress')
    .select('chapter_id')
    .eq('player_id', userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map(r => r.chapter_id));
}

export async function getChapterById(chapterId: number): Promise<CampaignChapter | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('campaign_chapters')
    .select('*')
    .eq('id', chapterId)
    .single();
  if (error) return null;
  return data as CampaignChapter;
}
```

- [ ] **Step 4: Run test to confirm 3 pass**

```bash
npx jest lib/__tests__/campaign.test.ts --no-coverage 2>&1 | tail -5
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/campaign.ts lib/__tests__/campaign.test.ts
git commit -m "feat: add lib/campaign.ts — types, isChapterUnlocked, getCampaignData helpers"
```

---

### Task 3: `/api/campaign/complete` Route

**Files:**
- Create: `app/api/campaign/complete/route.ts`
- Create: `app/api/campaign/complete/route.test.ts`

Pattern: exactly mirrors `app/api/games/complete/route.ts`.

- [ ] **Step 1: Write the failing test**

Create `app/api/campaign/complete/route.test.ts`:

```typescript
jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { mapCampaignError } from './route';

describe('mapCampaignError', () => {
  it('401 for unauthorized', () => expect(mapCampaignError('unauthorized').status).toBe(401));
  it('400 for invalid_body', () => expect(mapCampaignError('invalid_body').status).toBe(400));
  it('404 for chapter_not_found', () => expect(mapCampaignError('chapter_not_found').status).toBe(404));
  it('500 for unknown', () => expect(mapCampaignError('boom').status).toBe(500));
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx jest app/api/campaign/complete/route.test.ts --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Write `app/api/campaign/complete/route.ts`**

```typescript
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface CompleteBody {
  chapterId: number;
  winner: 'player' | 'opponent' | 'tie';
  playerScore: number;
  opponentScore: number;
}

export function mapCampaignError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized')     return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body')     return { status: 400, body: { error: 'Invalid request body' } };
  if (msg === 'chapter_not_found') return { status: 404, body: { error: 'Chapter not found' } };
  console.error('[campaign/complete] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const { status, body } = mapCampaignError('unauthorized');
    return NextResponse.json(body, { status });
  }

  let body: CompleteBody;
  try {
    body = await request.json() as CompleteBody;
    if (
      typeof body.chapterId !== 'number' ||
      !['player', 'opponent', 'tie'].includes(body.winner) ||
      typeof body.playerScore !== 'number' ||
      typeof body.opponentScore !== 'number'
    ) throw new Error();
  } catch {
    const { status, body: errBody } = mapCampaignError('invalid_body');
    return NextResponse.json(errBody, { status });
  }

  try {
    const { data, error } = await server.rpc('complete_campaign_chapter', {
      p_chapter_id:    body.chapterId,
      p_winner:        body.winner,
      p_player_score:  body.playerScore,
      p_opponent_score: body.opponentScore,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body: errBody } = mapCampaignError(msg);
    return NextResponse.json(errBody, { status });
  }
}
```

- [ ] **Step 4: Run test to confirm 4 pass**

```bash
npx jest app/api/campaign/complete/route.test.ts --no-coverage 2>&1 | tail -5
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/campaign/complete/
git commit -m "feat: add /api/campaign/complete route"
```

---

### Task 4: Campaign Pages + Nav Link

**Files:**
- Create: `app/campaign/page.tsx`
- Create: `app/campaign/[chapterId]/page.tsx`
- Modify: `components/NavBar.tsx`

#### 4a: Campaign Hub (`app/campaign/page.tsx`)

- [ ] **Step 1: Write `app/campaign/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getCampaignData, getPlayerCampaignProgress, isChapterUnlocked, type CampaignArc, type CampaignChapter } from '@/lib/campaign';

export default function CampaignPage() {
  const [arcs, setArcs] = useState<CampaignArc[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);
      try {
        const [arcData, progress] = await Promise.all([
          getCampaignData(),
          getPlayerCampaignProgress(user.id),
        ]);
        if (!mounted) return;
        setArcs(arcData);
        setCompletedIds(progress);
      } catch {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const allChapters = arcs.flatMap(a => a.chapters);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading campaign…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px', fontFamily: "'Cinzel', serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ color: '#ffd54f', fontSize: '0.72em', letterSpacing: 2, marginBottom: 6 }}>STORY MODE</div>
        <h1 style={{ color: '#fff', fontSize: '2em', margin: 0 }}>Campaign</h1>
      </div>

      {arcs.map(arc => {
        const arcCompleted = arc.chapters.every(c => completedIds.has(c.id));
        const arcProgress = arc.chapters.filter(c => completedIds.has(c.id)).length;
        return (
          <div key={arc.id} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '1.4em' }}>{arc.theme_emoji}</span>
              <div>
                <div style={{ color: arcCompleted ? '#ffd54f' : '#fff', fontSize: '1.1em', fontWeight: 700 }}>
                  {arc.title}
                  {arcCompleted && <span style={{ marginLeft: 8 }}>{arc.badge_emoji}</span>}
                </div>
                <div style={{ color: '#555', fontSize: '0.7em' }}>
                  {arcProgress}/{arc.chapters.length} completed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arc.chapters.map(chapter => {
                const done = completedIds.has(chapter.id);
                const unlocked = isChapterUnlocked(chapter, completedIds, allChapters);
                const diffColor: Record<string, string> = {
                  easy: '#a5d6a7', normal: '#ffd54f', hard: '#ef9a9a', expert: '#ce93d8'
                };
                return (
                  <div
                    key={chapter.id}
                    style={{
                      background: done ? '#0d1f0d' : unlocked ? '#111' : '#0a0a0a',
                      border: `1px solid ${done ? '#2e5e2e' : unlocked ? '#1e1e1e' : '#111'}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      opacity: unlocked ? 1 : 0.45,
                    }}
                  >
                    <div>
                      <div style={{ color: done ? '#a5d6a7' : '#fff', fontSize: '0.92em', fontWeight: 700, marginBottom: 2 }}>
                        {done ? '✅ ' : unlocked ? '' : '🔒 '}{chapter.title}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: '#555', fontSize: '0.68em' }}>vs {chapter.ai_opponent_name}</span>
                        <span style={{ color: diffColor[chapter.ai_difficulty] ?? '#aaa', fontSize: '0.65em', fontWeight: 700, textTransform: 'uppercase' }}>
                          {chapter.ai_difficulty}
                        </span>
                        {chapter.win_condition === 'win_by_margin' && (
                          <span style={{ color: '#555', fontSize: '0.65em' }}>win by {chapter.win_param}+</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#ffd54f', fontSize: '0.72em' }}>+{chapter.xp_reward} XP</span>
                      {unlocked && (
                        <Link
                          href={`/campaign/${chapter.id}`}
                          style={{
                            background: done ? '#1a2e1a' : '#5c6bc0',
                            color: done ? '#a5d6a7' : '#fff',
                            border: 'none', borderRadius: 8,
                            padding: '6px 14px', fontSize: '0.75em', fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                            fontFamily: "'Cinzel', serif",
                          }}
                        >
                          {done ? 'Replay' : 'Play'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

#### 4b: Campaign Play Page (`app/campaign/[chapterId]/page.tsx`)

This page manages three phases: `intro` → `playing` → `result`.

In the `playing` phase it reuses the full game engine. Scores are read from `state` when `onNewGame` fires (i.e., when game ends and player clicks the game-over button).

- [ ] **Step 2: Write `app/campaign/[chapterId]/page.tsx`**

```tsx
'use client';
import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { fetchCardsByReleaseIds, fetchReleases } from '@/lib/supabase';
import { buildBalancedDecks } from '@/lib/deck';
import { createGame, isGameOver, getWinner, calcScore } from '@/lib/GameEngine';
import { chooseAiMove } from '@/lib/ai';
import GameBoardV2 from '@/components/GameBoardV2';
import { getChapterById, type CampaignChapter } from '@/lib/campaign';
import type { GameState, GameOptions, Card } from '@/lib/types';

type Phase = 'loading' | 'intro' | 'playing' | 'result' | 'error';

interface CampaignResult {
  chapterPassed: boolean;
  winner: 'player' | 'opponent' | 'tie';
  playerScore: number;
  opponentScore: number;
  xpAwarded: number;
  arcCompleted: boolean;
  badgeEmoji: string | null;
  badgeName: string | null;
}

const DEFAULT_OPTIONS: GameOptions = {
  handSize: 5, guaranteedEvent: true, maxPlays: 3, eventCount: 2,
  firstPlayer: 'coinFlip', setAsideCount: 4, aiDifficulty: 'normal', customDeckId: null,
};

export default function CampaignChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId: chapterIdStr } = use(params);
  const chapterId = parseInt(chapterIdStr, 10);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [chapter, setChapter] = useState<CampaignChapter | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [starting, setStarting] = useState(false);
  const resultCalled = useRef(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { window.location.href = '/login'; return; }
      const ch = await getChapterById(chapterId);
      if (!mounted) return;
      if (!ch) { setPhase('error'); return; }
      setChapter(ch);
      setPhase('intro');
    }).catch(() => { if (mounted) setPhase('error'); });
    return () => { mounted = false; };
  }, [chapterId]);

  const startBattle = useCallback(async () => {
    if (!chapter || starting) return;
    setStarting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const releases = await fetchReleases(supabase);
      const firstTwo = releases.slice(0, 2).map((r: { id: number }) => r.id);
      const pool = await fetchCardsByReleaseIds(firstTwo.length >= 2 ? firstTwo : releases.map((r: { id: number }) => r.id), supabase);
      const { playerDeck, opponentDeck } = buildBalancedDecks(pool, { eventCount: DEFAULT_OPTIONS.eventCount });
      const options: GameOptions = { ...DEFAULT_OPTIONS, aiDifficulty: chapter.ai_difficulty };
      const gs = createGame(playerDeck, opponentDeck, false, options, 'player');
      setGameState(gs);
      setPhase('playing');
    } catch {
      setPhase('error');
    } finally {
      setStarting(false);
    }
  }, [chapter, starting]);

  // onNewGame fires when the player clicks "Play Again" in GameOverScreen
  // In campaign mode, we use this to transition to the result phase
  const handleGameEnd = useCallback(async () => {
    if (!gameState || !chapter || resultCalled.current) return;
    resultCalled.current = true;

    const winner = gameState.winner as 'player' | 'opponent' | 'tie' | null;
    const playerScore = calcScore(gameState.player.field);
    const opponentScore = calcScore(gameState.opponent.field);

    const finalWinner = winner ?? 'tie';
    try {
      const r = await fetch('/api/campaign/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          winner: finalWinner,
          playerScore,
          opponentScore,
        }),
      });
      const data = await r.json() as {
        ok?: boolean;
        chapter_passed?: boolean;
        xp_awarded?: number;
        arc_completed?: boolean;
        badge_emoji?: string;
        badge_name?: string;
      };
      setResult({
        chapterPassed: data.chapter_passed ?? false,
        winner: finalWinner,
        playerScore,
        opponentScore,
        xpAwarded: data.xp_awarded ?? 0,
        arcCompleted: data.arc_completed ?? false,
        badgeEmoji: data.badge_emoji ?? null,
        badgeName: data.badge_name ?? null,
      });
    } catch {
      setResult({
        chapterPassed: false,
        winner: finalWinner,
        playerScore,
        opponentScore,
        xpAwarded: 0,
        arcCompleted: false,
        badgeEmoji: null,
        badgeName: null,
      });
    }
    setPhase('result');
  }, [gameState, chapter]);

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading chapter…
      </div>
    );
  }

  if (phase === 'error' || !chapter) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350' }}>
        Chapter not found.{' '}
        <button onClick={() => router.push('/campaign')} style={{ background: 'none', border: 'none', color: '#5c6bc0', cursor: 'pointer', marginLeft: 8 }}>
          Back to Campaign
        </button>
      </div>
    );
  }

  if (phase === 'intro') {
    const diffColor: Record<string, string> = {
      easy: '#a5d6a7', normal: '#ffd54f', hard: '#ef9a9a', expert: '#ce93d8'
    };
    return (
      <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
        <div style={{ color: '#ffd54f', fontSize: '0.7em', letterSpacing: 2, marginBottom: 8 }}>CAMPAIGN CHAPTER</div>
        <h1 style={{ color: '#fff', fontSize: '1.7em', margin: '0 0 8px' }}>{chapter.title}</h1>
        <div style={{ color: '#555', fontSize: '0.78em', marginBottom: 24 }}>
          vs{' '}
          <span style={{ color: '#aaa' }}>{chapter.ai_opponent_name}</span>
          {' · '}
          <span style={{ color: diffColor[chapter.ai_difficulty] }}>
            {chapter.ai_difficulty.charAt(0).toUpperCase() + chapter.ai_difficulty.slice(1)}
          </span>
          {chapter.win_condition === 'win_by_margin' && (
            <span style={{ color: '#888' }}> · win by {chapter.win_param}+ points</span>
          )}
        </div>
        <div style={{
          background: '#0a0a0a', border: '1px solid #1e1e1e',
          borderRadius: 16, padding: '24px 20px', marginBottom: 28,
          color: '#aaa', fontSize: '0.88em', fontFamily: 'sans-serif',
          lineHeight: 1.7, textAlign: 'left',
        }}>
          {chapter.narrative_intro}
        </div>
        <div style={{ color: '#555', fontSize: '0.72em', marginBottom: 16 }}>
          Victory reward: <span style={{ color: '#ffd54f' }}>+{chapter.xp_reward} XP</span>
        </div>
        <button
          onClick={startBattle}
          disabled={starting}
          style={{
            background: '#5c6bc0', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px 40px',
            fontFamily: "'Cinzel', serif", fontSize: '1em', fontWeight: 700,
            cursor: starting ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
          }}
        >
          {starting ? 'Preparing…' : '⚔️ Start Battle'}
        </button>
      </div>
    );
  }

  if (phase === 'playing' && gameState) {
    return (
      <GameBoardV2
        state={gameState}
        onStateChange={setGameState}
        mode="ai"
        onNewGame={handleGameEnd}
        playerNames={{ player: 'You', opponent: chapter.ai_opponent_name }}
      />
    );
  }

  if (phase === 'result' && result && chapter) {
    const outro = result.winner === 'player' ? chapter.narrative_outro_win : chapter.narrative_outro_loss;
    const passColor = result.chapterPassed ? '#a5d6a7' : '#ef9a9a';
    const passBg = result.chapterPassed ? '#0a2e0a' : '#2e0a0a';
    return (
      <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>
        <div style={{ fontSize: '3em', marginBottom: 12 }}>
          {result.chapterPassed ? '🏆' : '💀'}
        </div>
        <h1 style={{
          color: passColor, fontSize: '1.6em', margin: '0 0 8px',
        }}>
          {result.chapterPassed ? 'Victory!' : 'Defeat'}
        </h1>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a5d6a7', fontSize: '0.7em', marginBottom: 2 }}>YOU</div>
            <div style={{ color: '#fff', fontSize: '2em', fontWeight: 700 }}>{result.playerScore}</div>
          </div>
          <div style={{ color: '#333', alignSelf: 'center', fontSize: '1.2em' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ef9a9a', fontSize: '0.7em', marginBottom: 2 }}>OPPONENT</div>
            <div style={{ color: '#fff', fontSize: '2em', fontWeight: 700 }}>{result.opponentScore}</div>
          </div>
        </div>

        <div style={{
          background: passBg, border: `1px solid ${passColor}44`,
          borderRadius: 16, padding: '20px 16px', marginBottom: 20,
          color: '#aaa', fontSize: '0.85em', fontFamily: 'sans-serif', lineHeight: 1.6,
          textAlign: 'left',
        }}>
          {outro}
        </div>

        {result.xpAwarded > 0 && (
          <div style={{ color: '#ffd54f', fontSize: '1em', fontWeight: 700, marginBottom: 12 }}>
            +{result.xpAwarded} XP earned
          </div>
        )}

        {result.arcCompleted && result.badgeEmoji && (
          <div style={{
            background: '#1a1200', border: '1px solid #ffd54f44',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20,
            color: '#ffd54f', fontSize: '0.85em',
          }}>
            {result.badgeEmoji} Arc complete — <strong>{result.badgeName}</strong> badge earned!
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {result.chapterPassed ? (
            <button
              onClick={() => router.push('/campaign')}
              style={{
                background: '#5c6bc0', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 28px',
                fontFamily: "'Cinzel', serif", fontSize: '0.9em', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Next Chapter →
            </button>
          ) : (
            <button
              onClick={() => { resultCalled.current = false; setPhase('intro'); setGameState(null); setResult(null); }}
              style={{
                background: '#5c6bc0', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 28px',
                fontFamily: "'Cinzel', serif", fontSize: '0.9em', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => router.push('/campaign')}
            style={{
              background: '#111', color: '#aaa', border: '1px solid #222',
              borderRadius: 10, padding: '12px 28px',
              fontFamily: "'Cinzel', serif", fontSize: '0.9em', cursor: 'pointer',
            }}
          >
            Campaign Map
          </button>
        </div>
      </div>
    );
  }

  return null;
}
```

**Note on `calcScore`:** Verify that `calcScore` exists as a named export from `@/lib/GameEngine`. If it doesn't exist with that name, look for the correct function name (may be `getScore`, `computeScore`, etc.) by checking the GameEngine file. Use whatever function computes the total score of a player's field.

#### 4c: Add nav link

- [ ] **Step 3: Add Campaign to NavBar.tsx**

Read `components/NavBar.tsx`. Find the `NAV_ITEMS` array. Add after the `tutorial` entry:

```typescript
{ href: '/campaign', label: 'Campaign', icon: 'auto_stories', auth: true },
```

- [ ] **Step 4: TypeScript check**

```bash
cd "/Users/josh/Desktop/Projects/Math Game/.worktrees/feat-campaign"
npx tsc --noEmit 2>&1 | head -30
```

Fix any errors.

- [ ] **Step 5: Commit**

```bash
git add app/campaign/ components/NavBar.tsx
git commit -m "feat: add campaign hub and play pages, Campaign nav link"
```

---

### Task 5: Tests, Build, and BACKLOG

- [ ] **Step 1: Full test run**

```bash
cd "/Users/josh/Desktop/Projects/Math Game/.worktrees/feat-campaign"
npx jest --no-coverage 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 2: Build check**

```bash
npx next build 2>&1 | tail -10
```

Expected: successful build.

- [ ] **Step 3: Mark Campaign done in BACKLOG.md**

Find the Campaign / Story Mode line (contains "#29") and change `[ ]` to `[x]`.

```bash
git add BACKLOG.md
git commit -m "chore: mark Campaign / Story Mode (#29) as done in BACKLOG"
```
