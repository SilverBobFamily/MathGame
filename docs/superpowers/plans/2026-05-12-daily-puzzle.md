# Daily Puzzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One curated math puzzle per day, same for all players. Player sees a mid-game board state, picks their best card play, gets scored against the optimal answer, earns XP. Resets at UTC midnight.

**Architecture:** New `daily_puzzles` table stores card-ID arrays for the board state (no full GameState blob — simpler). The rotation cycles by `floor(epoch_seconds / 86400) % puzzle_count`. A `player_puzzle_attempts` table is idempotent per player+puzzle. The API route `/api/puzzle/submit` validates the answer and awards XP. The `/puzzle` page renders the board using card data fetched at load time.

**Tech Stack:** Supabase SQL, Next.js App Router, React, TypeScript.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260512000013_daily_puzzle.sql` | Create | Tables, seed 7 puzzles, RPCs |
| `lib/puzzle.ts` | Create | Types + client helpers |
| `lib/__tests__/puzzle.test.ts` | Create | Unit tests |
| `app/api/puzzle/submit/route.ts` | Create | Submit answer, award XP |
| `app/api/puzzle/submit/route.test.ts` | Create | Route error-map tests |
| `app/puzzle/page.tsx` | Create | Daily puzzle UI |

---

### Task 1: SQL Migration

**Files:**
- Create: `supabase/migrations/20260512000013_daily_puzzle.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Daily Puzzle
-- Requires: players, cards tables

-- ── Tables ─────────────────────────────────────────────────────────────────

create table daily_puzzles (
  id                          serial primary key,
  rotation_index              int  unique not null,
  title                       text not null,
  description                 text not null,        -- hint shown to player
  opponent_field_card_ids     int[] not null,       -- creature card IDs on opponent side
  player_field_card_ids       int[] not null,       -- creature card IDs already on player side
  player_hand_card_ids        int[] not null,       -- card IDs player chooses from
  solution_card_id            int  not null references cards(id),
  solution_target_side        text not null default 'player'
    check(solution_target_side in ('player','opponent')),
  solution_target_creature_id int references cards(id), -- non-null for item/action cards
  explanation                 text not null,        -- shown after submit
  xp_reward                   int  not null default 50
);

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
-- Returns the puzzle for today, cycling through available puzzles by UTC date.
-- No auth required — same puzzle for everyone.

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
-- Returns: { is_correct boolean, xp_awarded int, already_attempted boolean }
-- Idempotent: second call for same player+puzzle_id returns already_attempted=true.

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
  v_already      boolean := false;
begin
  if v_player_id is null then
    raise exception 'unauthorized';
  end if;

  -- Check already attempted today
  if exists (
    select 1 from public.player_puzzle_attempts
    where player_id = v_player_id
      and puzzle_id = p_puzzle_id
      and attempted_date = v_today
  ) then
    return jsonb_build_object('already_attempted', true, 'is_correct', null, 'xp_awarded', 0);
  end if;

  -- Load puzzle
  select solution_card_id, solution_target_side, solution_target_creature_id, xp_reward
  into v_puzzle
  from public.daily_puzzles where id = p_puzzle_id;

  if not found then
    raise exception 'puzzle_not_found';
  end if;

  -- Check correctness
  v_is_correct :=
    p_submitted_card_id = v_puzzle.solution_card_id
    and p_submitted_target_side = v_puzzle.solution_target_side
    and (
      v_puzzle.solution_target_creature_id is null
      or p_submitted_creature_id = v_puzzle.solution_target_creature_id
    );

  v_xp_reward := case when v_is_correct then v_puzzle.xp_reward else 10 end;

  -- Record attempt
  insert into public.player_puzzle_attempts
    (player_id, puzzle_id, attempted_date, is_correct, xp_awarded)
  values
    (v_player_id, p_puzzle_id, v_today, v_is_correct, true)
  on conflict (player_id, puzzle_id, attempted_date) do nothing;

  -- Award XP (always award participation XP, bonus for correct)
  if found then
    update public.players
    set xp = xp + v_xp_reward
    where id = v_player_id;
  end if;

  return jsonb_build_object(
    'already_attempted', false,
    'is_correct',        v_is_correct,
    'xp_awarded',        case when found then v_xp_reward else 0 end
  );
end;
$$;

revoke execute on function submit_puzzle_answer(int, int, text, int) from public, anon;
grant  execute on function submit_puzzle_answer(int, int, text, int) to authenticated, service_role;

-- ── Seed 7 puzzles ─────────────────────────────────────────────────────────
-- Uses dynamic card ID selection so it works with any card set.

do $$
declare
  -- High-value creatures (value >= 7)
  hc1 int; hc2 int; hc3 int;
  -- Mid-value creatures (value 3–6)
  mc1 int; mc2 int; mc3 int; mc4 int;
  -- Low-value creatures (value 1–2)
  lc1 int; lc2 int;
  -- Negative creatures
  nc1 int;
  -- Items with positive operator (+N)
  ip1 int; ip2 int;
  -- Actions with multiplier (×N, operator_value > 1)
  am1 int; am2 int;
  -- Actions with divisor (÷N)
  ad1 int;
begin
  -- Fetch creature IDs by value tier (distinct cards)
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
  -- Items and actions
  select id into ip1 from public.cards where type='item' and operator_value > 0 order by operator_value desc, id limit 1;
  select id into ip2 from public.cards where type='item' and operator_value > 0 and id <> ip1 order by operator_value desc, id limit 1;
  select id into am1 from public.cards where type='action' and operator like '×%' and operator_value > 1 order by operator_value desc, id limit 1;
  select id into am2 from public.cards where type='action' and operator like '×%' and operator_value > 1 and id <> am1 order by operator_value desc, id limit 1;
  select id into ad1 from public.cards where type='action' and operator like '÷%' order by id limit 1;

  insert into public.daily_puzzles
    (rotation_index, title, description,
     opponent_field_card_ids, player_field_card_ids, player_hand_card_ids,
     solution_card_id, solution_target_side, solution_target_creature_id,
     explanation, xp_reward)
  values
    -- Puzzle 0: Play the multiplier on your best creature
    (0, 'Double Down',
     'Opponent has a strong field. Pick the card that gives you the biggest score boost.',
     array[hc1, mc1],          -- opponent field
     array[hc2],               -- player field (1 creature)
     array[am1, mc2, lc1],     -- hand: multiplier action, mid creature, low creature
     am1, 'player', hc2,       -- solution: play multiplier on own hc2
     'The action multiplier applied to your high-value creature is far more powerful than adding a new creature.',
     75),

    -- Puzzle 1: Deploy a strong creature
    (1, 'Best in Show',
     'Your field is empty. One card here wins it all.',
     array[mc1, mc2],          -- opponent field (2 mid creatures)
     array[]::int[],           -- player field empty
     array[hc1, lc1, nc1],     -- hand: high creature, low creature, negative creature
     hc1, 'player', null,      -- solution: play the highest creature
     'Deploying your highest-value creature gives you an immediate score advantage over the opponent.',
     50),

    -- Puzzle 2: Boost an existing creature with item
    (2, 'The Right Tool',
     'You have a creature out. The opponent is slightly ahead. What one play closes the gap?',
     array[hc1, hc2],          -- opponent field (two high creatures)
     array[mc1],               -- player field (one mid creature)
     array[ip1, lc1, lc2],     -- hand: positive item, two low creatures
     ip1, 'player', mc1,       -- solution: apply item to mc1
     'Adding the item bonus to your existing creature is stronger than playing a low-value creature.',
     50),

    -- Puzzle 3: Multiplier on opponent's biggest creature (opponent side play)
    (3, 'Turn the Tables',
     'Opponent''s top creature is dominating. Which play helps YOU most?',
     array[hc1, mc2],          -- opponent field
     array[hc3],               -- player field (strong creature)
     array[am1, mc3, ip2],     -- hand: multiplier, mid creature, item
     am1, 'player', hc3,       -- solution: multiply your own hc3 (not the opponent's)
     'Multiplying your own high-value creature scores more than adding a smaller creature or a modest item.',
     75),

    -- Puzzle 4: Pick the highest creature with no modifiers
    (4, 'Pure Muscle',
     'No tricks today — just pick the strongest creature.',
     array[mc1, mc2, mc3],     -- opponent field (3 mid creatures)
     array[mc4],               -- player field
     array[hc1, hc2, nc1],     -- hand: two high creatures, one negative
     hc1, 'player', null,      -- solution: highest creature
     'The highest-value creature maximises your field score. The negative creature would hurt you.',
     50),

    -- Puzzle 5: Avoid playing the negative creature
    (5, 'Mind the Minus',
     'Careful — not every card in your hand is helpful.',
     array[hc1, mc1],          -- opponent field
     array[hc2, mc2],          -- player field (already has two good creatures)
     array[nc1, lc1, ip1],     -- hand: negative, low, positive item
     ip1, 'player', hc2,       -- solution: apply item to hc2 (best boost)
     'The negative creature would lower your score. The item on your best creature is the winning play.',
     75),

    -- Puzzle 6: Apply a large multiplier action (×10 if exists, else biggest)
    (6, 'Grand Multiplier',
     'One play can completely change the board. Which card has the highest potential?',
     array[hc1, hc2, mc1],     -- opponent field (strong)
     array[mc2],               -- player field (mid creature)
     array[am1, am2, lc1],     -- hand: two multipliers, low creature
     am1, 'player', mc2,       -- solution: biggest multiplier on mc2
     'The highest multiplier on your creature swings the score more than any other play available.',
     100);
end $$;
```

- [ ] **Step 2: Apply the migration**

```bash
cd "/Users/josh/Desktop/Projects/Math Game"
npx supabase db push
```

Expected: migration applied, `select count(*) from daily_puzzles;` returns 7.

- [ ] **Step 3: Commit**

```bash
cd /path/to/worktree
git add supabase/migrations/20260512000013_daily_puzzle.sql
git commit -m "feat: add daily_puzzle migration — tables, 7 puzzles, get_today/submit RPCs"
```

---

### Task 2: `lib/puzzle.ts` + Tests

**Files:**
- Create: `lib/puzzle.ts`
- Create: `lib/__tests__/puzzle.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/__tests__/puzzle.test.ts`:

```typescript
import { scorePlay, type PuzzleCard } from '../puzzle';

const creature = (value: number): PuzzleCard => ({
  id: value * 100, name: `C${value}`, type: 'creature',
  value, operator: null, operator_value: null, art_emoji: '🐉', release_id: 1,
});

const item = (opVal: number): PuzzleCard => ({
  id: opVal * 1000, name: `Item+${opVal}`, type: 'item',
  value: null, operator: `+${opVal}`, operator_value: opVal, art_emoji: '⚔️', release_id: 1,
});

describe('scorePlay', () => {
  it('scores deploying a creature', () => {
    const field: PuzzleCard[] = [creature(5)];
    const result = scorePlay(field, creature(8), 'player', null);
    expect(result).toBe(13); // 5 + 8
  });

  it('scores applying an item to a creature already on field', () => {
    const field: PuzzleCard[] = [creature(5)];
    const result = scorePlay(field, item(3), 'player', field[0].id);
    expect(result).toBe(8); // 5 + 3
  });

  it('returns base field score when card is null', () => {
    const field: PuzzleCard[] = [creature(5), creature(3)];
    expect(scorePlay(field, null, 'player', null)).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx jest lib/__tests__/puzzle.test.ts --no-coverage
```

Expected: `Cannot find module '../puzzle'`

- [ ] **Step 3: Write `lib/puzzle.ts`**

```typescript
import { createSupabaseBrowserClient } from './supabase-browser';

export interface PuzzleCard {
  id: number;
  name: string;
  type: 'creature' | 'item' | 'action' | 'event';
  value: number | null;
  operator: string | null;
  operator_value: number | null;
  art_emoji: string;
  release_id: number;
}

export interface DailyPuzzle {
  id: number;
  rotation_index: number;
  title: string;
  description: string;
  opponent_field: PuzzleCard[];
  player_field: PuzzleCard[];
  player_hand: PuzzleCard[];
  solution_card_id: number;
  solution_target_side: 'player' | 'opponent';
  solution_target_creature_id: number | null;
  explanation: string;
  xp_reward: number;
}

export interface PuzzleRawRow {
  id: number;
  rotation_index: number;
  title: string;
  description: string;
  opponent_field_card_ids: number[];
  player_field_card_ids: number[];
  player_hand_card_ids: number[];
  solution_card_id: number;
  solution_target_side: string;
  solution_target_creature_id: number | null;
  explanation: string;
  xp_reward: number;
}

export function scorePlay(
  currentField: PuzzleCard[],
  card: PuzzleCard | null,
  targetSide: 'player' | 'opponent',
  targetCreatureId: number | null,
): number {
  if (card === null) {
    return currentField.reduce((sum, fc) => sum + (fc.value ?? 0), 0);
  }

  if (card.type === 'creature') {
    return currentField.reduce((sum, fc) => sum + (fc.value ?? 0), 0) + (card.value ?? 0);
  }

  // Item or action: add operator_value to the target creature's base value
  const opVal = card.operator_value ?? 0;
  return currentField.reduce((sum, fc) => {
    const base = fc.value ?? 0;
    if (fc.id === targetCreatureId) {
      if (card.operator?.startsWith('×')) return sum + base * opVal;
      if (card.operator?.startsWith('÷')) return sum + (opVal !== 0 ? base / opVal : base);
      return sum + base + opVal; // + or -
    }
    return sum + base;
  }, 0);
}

async function fetchCardsByIds(ids: number[]): Promise<PuzzleCard[]> {
  if (ids.length === 0) return [];
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('cards')
    .select('id, name, type, value, operator, operator_value, art_emoji, release_id')
    .in('id', ids);
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map(c => [c.id, c as PuzzleCard]));
  return ids.map(id => map.get(id)!).filter(Boolean);
}

export async function getTodayPuzzle(): Promise<DailyPuzzle | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('get_today_puzzle');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const row = data[0] as PuzzleRawRow;
  const allIds = [
    ...row.opponent_field_card_ids,
    ...row.player_field_card_ids,
    ...row.player_hand_card_ids,
  ];
  const unique = [...new Set(allIds)];
  const cards = await fetchCardsByIds(unique);
  const byId = new Map(cards.map(c => [c.id, c]));
  const pick = (ids: number[]) => ids.map(id => byId.get(id)!).filter(Boolean);

  return {
    id: row.id,
    rotation_index: row.rotation_index,
    title: row.title,
    description: row.description,
    opponent_field: pick(row.opponent_field_card_ids),
    player_field: pick(row.player_field_card_ids),
    player_hand: pick(row.player_hand_card_ids),
    solution_card_id: row.solution_card_id,
    solution_target_side: row.solution_target_side as 'player' | 'opponent',
    solution_target_creature_id: row.solution_target_creature_id,
    explanation: row.explanation,
    xp_reward: row.xp_reward,
  };
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest lib/__tests__/puzzle.test.ts --no-coverage
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/puzzle.ts lib/__tests__/puzzle.test.ts
git commit -m "feat: add lib/puzzle.ts — PuzzleCard type, scorePlay helper, getTodayPuzzle"
```

---

### Task 3: `/api/puzzle/submit` Route

**Files:**
- Create: `app/api/puzzle/submit/route.ts`
- Create: `app/api/puzzle/submit/route.test.ts`

Pattern: follows `app/api/games/complete/route.ts` exactly.

- [ ] **Step 1: Write failing test**

Create `app/api/puzzle/submit/route.test.ts`:

```typescript
jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock('@/lib/supabase-service', () => ({ createSupabaseServiceClient: jest.fn() }));

import { mapSubmitError } from './route';

describe('mapSubmitError', () => {
  it('401 for unauthorized', () => expect(mapSubmitError('unauthorized').status).toBe(401));
  it('400 for invalid_body', () => expect(mapSubmitError('invalid_body').status).toBe(400));
  it('400 for already_attempted', () => expect(mapSubmitError('already_attempted').status).toBe(200));
  it('500 for unknown', () => expect(mapSubmitError('boom').status).toBe(500));
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx jest app/api/puzzle/submit/route.test.ts --no-coverage
```

- [ ] **Step 3: Write `app/api/puzzle/submit/route.ts`**

```typescript
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface SubmitBody {
  puzzleId: number;
  submittedCardId: number;
  submittedTargetSide: 'player' | 'opponent';
  submittedCreatureId: number | null;
}

export function mapSubmitError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized')       return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body')       return { status: 400, body: { error: 'Invalid request body' } };
  if (msg === 'already_attempted')  return { status: 200, body: { already_attempted: true } };
  console.error('[puzzle/submit] unexpected error:', msg);
  return { status: 500, body: { error: 'Internal server error' } };
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const { status, body } = mapSubmitError('unauthorized');
    return NextResponse.json(body, { status });
  }

  let body: SubmitBody;
  try {
    body = await request.json() as SubmitBody;
    if (typeof body.puzzleId !== 'number' || typeof body.submittedCardId !== 'number') throw new Error();
  } catch {
    const { status, body: errBody } = mapSubmitError('invalid_body');
    return NextResponse.json(errBody, { status });
  }

  try {
    const { data, error } = await server.rpc('submit_puzzle_answer', {
      p_puzzle_id:             body.puzzleId,
      p_submitted_card_id:     body.submittedCardId,
      p_submitted_target_side: body.submittedTargetSide,
      p_submitted_creature_id: body.submittedCreatureId ?? null,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { status, body: errBody } = mapSubmitError(msg);
    return NextResponse.json(errBody, { status });
  }
}
```

Note: `submit_puzzle_answer` is granted to `authenticated`, so calling it via `server` (cookie-auth client) is correct. No service client needed.

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest app/api/puzzle/submit/route.test.ts --no-coverage
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/puzzle/submit/
git commit -m "feat: add /api/puzzle/submit route"
```

---

### Task 4: `/puzzle` Page

**Files:**
- Create: `app/puzzle/page.tsx`

The page:
1. On mount: calls `getTodayPuzzle()`, fetches user's attempt status for today's puzzle
2. Shows a simplified board: opponent field (top, read-only), player field (middle, read-only), player hand (bottom, selectable)
3. For creature cards: clicking selects it as the play (target side = 'player' automatically)
4. For item/action cards: clicking selects the card, then prompts to click a target creature on the player field
5. Submit button → POST to `/api/puzzle/submit` → shows result overlay
6. Result overlay: correct ✅ / incorrect ❌, explanation, XP earned, score breakdown

- [ ] **Step 1: Write `app/puzzle/page.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getTodayPuzzle, scorePlay, type DailyPuzzle, type PuzzleCard } from '@/lib/puzzle';

type Phase = 'loading' | 'ready' | 'selecting_target' | 'submitted' | 'error';

interface SubmitResult {
  already_attempted?: boolean;
  is_correct?: boolean;
  xp_awarded?: number;
}

function PuzzleCardPill({ card, selected, dimmed, onClick, isTarget }: {
  card: PuzzleCard; selected?: boolean; dimmed?: boolean; onClick?: () => void; isTarget?: boolean;
}) {
  const isCreature = card.type === 'creature';
  const label = isCreature ? String(card.value ?? '?') : (card.operator ?? card.type);
  const borderColor = isTarget ? '#ffd54f' : selected ? '#a5d6a7' : '#333';
  return (
    <div
      onClick={onClick}
      style={{
        background: '#111', border: `2px solid ${borderColor}`,
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.4 : 1,
        minWidth: 72,
        transition: 'border-color 0.15s',
        boxShadow: selected ? `0 0 12px ${borderColor}66` : 'none',
      }}
    >
      <div style={{ fontSize: '1.6em' }}>{card.art_emoji}</div>
      <div style={{ color: '#fff', fontFamily: "'Cinzel', serif", fontSize: '1.1em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: '#555', fontSize: '0.65em', textAlign: 'center', maxWidth: 64, lineHeight: 1.2 }}>
        {card.name}
      </div>
    </div>
  );
}

function FieldRow({ label, cards, targetCreatureId, onTargetClick }: {
  label: string; cards: PuzzleCard[];
  targetCreatureId?: number | null;
  onTargetClick?: (id: number) => void;
}) {
  const total = cards.reduce((s, c) => s + (c.value ?? 0), 0);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#555', fontSize: '0.75em', letterSpacing: 1 }}>{label}</span>
        <span style={{ color: '#ffd54f', fontSize: '0.85em', fontWeight: 700 }}>{total}</span>
      </div>
      {cards.length === 0 ? (
        <div style={{ color: '#333', fontSize: '0.8em', fontStyle: 'italic', padding: '8px 0' }}>
          Empty field
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cards.map(c => (
            <PuzzleCardPill
              key={c.id} card={c}
              isTarget={targetCreatureId === c.id}
              onClick={onTargetClick ? () => onTargetClick(c.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PuzzlePage() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<PuzzleCard | null>(null);
  const [targetCreatureId, setTargetCreatureId] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);
      try {
        const p = await getTodayPuzzle();
        if (!p) { setPhase('error'); return; }
        setPuzzle(p);

        // Check if already attempted today
        const today = new Date().toISOString().split('T')[0];
        const { data: attempts } = await supabase
          .from('player_puzzle_attempts')
          .select('is_correct, xp_awarded')
          .eq('player_id', user.id)
          .eq('puzzle_id', p.id)
          .eq('attempted_date', today)
          .limit(1);
        if (attempts && attempts.length > 0) {
          setResult({ already_attempted: true, is_correct: attempts[0].is_correct });
          setPhase('submitted');
        } else {
          setPhase('ready');
        }
      } catch {
        setPhase('error');
      }
    }).catch(() => setPhase('error'));
  }, []);

  const needsTarget = selectedCard && (selectedCard.type === 'item' || selectedCard.type === 'action');

  async function handleSubmit() {
    if (!puzzle || !selectedCard || !userId) return;
    if (needsTarget && targetCreatureId === null) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/puzzle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          submittedCardId: selectedCard.id,
          submittedTargetSide: 'player',
          submittedCreatureId: targetCreatureId,
        }),
      });
      const data = await r.json() as SubmitResult;
      setResult(data);
      setPhase('submitted');
    } catch {
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Loading today&apos;s puzzle…
      </div>
    );
  }
  if (phase === 'error' || !puzzle) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef5350' }}>
        No puzzle available today. Check back soon!
      </div>
    );
  }

  const playerScoreBase = puzzle.player_field.reduce((s, c) => s + (c.value ?? 0), 0);
  const playerScoreAfter = selectedCard
    ? scorePlay(puzzle.player_field, selectedCard, 'player', targetCreatureId)
    : playerScoreBase;
  const oppScore = puzzle.opponent_field.reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 20px', fontFamily: "'Cinzel', serif" }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ color: '#ffd54f', fontSize: '0.72em', letterSpacing: 2, marginBottom: 6 }}>DAILY PUZZLE</div>
        <h1 style={{ color: '#fff', fontSize: '1.6em', margin: '0 0 8px' }}>{puzzle.title}</h1>
        <p style={{ color: '#888', fontSize: '0.85em', margin: 0, fontFamily: 'sans-serif' }}>{puzzle.description}</p>
      </div>

      {/* Board */}
      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 16, padding: '20px 16px', marginBottom: 20 }}>
        <FieldRow label="OPPONENT FIELD" cards={puzzle.opponent_field} />
        <div style={{ borderTop: '1px solid #1e1e1e', margin: '12px 0' }} />
        <FieldRow
          label="YOUR FIELD"
          cards={puzzle.player_field}
          targetCreatureId={needsTarget ? targetCreatureId : null}
          onTargetClick={needsTarget && phase === 'ready' ? (id) => setTargetCreatureId(id) : undefined}
        />
      </div>

      {/* Score preview */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: '0.68em', marginBottom: 2 }}>YOUR SCORE</div>
          <div style={{ color: '#a5d6a7', fontSize: '1.8em', fontWeight: 700 }}>
            {selectedCard ? playerScoreAfter : playerScoreBase}
          </div>
        </div>
        <div style={{ color: '#333', alignSelf: 'center', fontSize: '1.2em' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555', fontSize: '0.68em', marginBottom: 2 }}>OPPONENT</div>
          <div style={{ color: '#ef9a9a', fontSize: '1.8em', fontWeight: 700 }}>{oppScore}</div>
        </div>
      </div>

      {/* Hand */}
      {phase === 'ready' && (
        <>
          <div style={{ color: '#555', fontSize: '0.72em', letterSpacing: 1, marginBottom: 10 }}>
            {needsTarget ? 'NOW CLICK A TARGET CREATURE ON YOUR FIELD' : 'CHOOSE A CARD TO PLAY'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {puzzle.player_hand.map(card => (
              <PuzzleCardPill
                key={card.id}
                card={card}
                selected={selectedCard?.id === card.id}
                onClick={() => {
                  setSelectedCard(card);
                  if (card.type === 'creature') setTargetCreatureId(null);
                }}
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedCard || (needsTarget && targetCreatureId === null) || submitting}
            style={{
              width: '100%', padding: '14px 0',
              background: selectedCard && (!needsTarget || targetCreatureId !== null) ? '#5c6bc0' : '#1a1a1a',
              color: selectedCard && (!needsTarget || targetCreatureId !== null) ? '#fff' : '#444',
              border: 'none', borderRadius: 10,
              fontFamily: "'Cinzel', serif", fontSize: '1em', fontWeight: 700,
              cursor: selectedCard ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Answer'}
          </button>
        </>
      )}

      {/* Result */}
      {phase === 'submitted' && result && (
        <div style={{
          background: result.is_correct ? '#0a2e0a' : result.already_attempted ? '#111' : '#2e0a0a',
          border: `2px solid ${result.is_correct ? '#a5d6a7' : result.already_attempted ? '#333' : '#ef9a9a'}`,
          borderRadius: 16, padding: '24px 20px', textAlign: 'center',
        }}>
          {result.already_attempted ? (
            <div style={{ color: '#aaa', fontSize: '0.9em' }}>You already solved today&apos;s puzzle!</div>
          ) : (
            <>
              <div style={{ fontSize: '2.5em', marginBottom: 8 }}>
                {result.is_correct ? '✅' : '❌'}
              </div>
              <div style={{ color: result.is_correct ? '#a5d6a7' : '#ef9a9a', fontSize: '1.3em', fontWeight: 700, marginBottom: 12 }}>
                {result.is_correct ? 'Correct!' : 'Not quite!'}
              </div>
            </>
          )}
          <p style={{ color: '#aaa', fontSize: '0.85em', fontFamily: 'sans-serif', lineHeight: 1.5, margin: '0 0 12px' }}>
            {puzzle.explanation}
          </p>
          {result.xp_awarded !== undefined && result.xp_awarded > 0 && (
            <div style={{ color: '#ffd54f', fontSize: '0.9em', fontWeight: 700 }}>
              +{result.xp_awarded} XP earned
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add puzzle link to nav**

Check `components/Nav.tsx` (or wherever the nav links live) and add a link to `/puzzle`. Read the file first to match the existing pattern.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/puzzle/ components/Nav.tsx  # or wherever nav is
git commit -m "feat: add /puzzle page — daily puzzle UI with card selection and result reveal"
```

---

### Task 5: Tests, Build, and BACKLOG

- [ ] **Step 1: Full test run**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: all tests pass (no new failures).

- [ ] **Step 2: Build check**

```bash
npx next build 2>&1 | tail -10
```

Expected: successful build.

- [ ] **Step 3: Mark Daily Puzzle done in BACKLOG.md**

```markdown
- [x] Daily Puzzle (#14) — ...
```

```bash
git add BACKLOG.md
git commit -m "chore: mark Daily Puzzle (#14) as done"
```
