# Math Learning Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance Learning Mode with an equation reveal on correct answers, a per-session summary in the post-game screen, and lifetime learning stat persistence with a section on the player profile.

**Architecture:** Six pieces in dependency order: DB migration → API route → LearningModePrompt → GameBoardV2 → GameOverScreen → game pages → profile page. Each piece is self-contained and independently testable.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase (PostgreSQL RLS + plpgsql RPC), Jest.

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/20260512000020_learning_stats.sql` | Create — table + RPC |
| `app/api/learning/stats/route.ts` | Create — POST handler |
| `app/api/learning/stats/route.test.ts` | Create — unit tests |
| `components/LearningModePrompt.tsx` | Modify — equation reveal, new `onCorrect` signature |
| `components/GameBoardV2.tsx` | Modify — accumulate stats, updated callbacks |
| `components/GameOverScreen.tsx` | Modify — learning stats summary panel |
| `app/game/page.tsx` | Modify — POST stats on game end |
| `app/v2/page.tsx` | Modify — POST stats on game end |
| `app/profile/page.tsx` | Modify — fetch + display learning stats section |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260512000020_learning_stats.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260512000020_learning_stats.sql
git commit -m "feat: add player_learning_stats table and record_learning_session RPC"
```

---

## Task 2: API Route — POST /api/learning/stats

**Files:**
- Create: `app/api/learning/stats/route.ts`
- Create: `app/api/learning/stats/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/api/learning/stats/route.test.ts
jest.mock('next/server', () => ({ NextResponse: { json: jest.fn() }, NextRequest: jest.fn() }));
jest.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: jest.fn() }));

import { mapLearningError, validateLearningBody } from './route';

describe('mapLearningError', () => {
  it('returns 401 for unauthorized', () => {
    expect(mapLearningError('unauthorized').status).toBe(401);
  });
  it('returns 400 for invalid_body', () => {
    expect(mapLearningError('invalid_body').status).toBe(400);
  });
  it('returns 500 for unknown error', () => {
    expect(mapLearningError('boom').status).toBe(500);
  });
});

describe('validateLearningBody', () => {
  const valid = {
    totalAttempted: 10, totalCorrect: 7,
    itemAttempted: 5,   itemCorrect: 4,
    actionAttempted: 5, actionCorrect: 3,
  };

  it('returns null for a valid body', () => {
    expect(validateLearningBody(valid)).toBeNull();
  });
  it('returns invalid_body when a field is missing', () => {
    const { totalAttempted: _, ...rest } = valid;
    expect(validateLearningBody(rest)).toBe('invalid_body');
  });
  it('returns invalid_body when a value is negative', () => {
    expect(validateLearningBody({ ...valid, totalCorrect: -1 })).toBe('invalid_body');
  });
  it('returns invalid_body when correct exceeds attempted', () => {
    expect(validateLearningBody({ ...valid, itemCorrect: 6 })).toBe('invalid_body');
  });
  it('returns invalid_body when a field is not an integer', () => {
    expect(validateLearningBody({ ...valid, totalAttempted: 1.5 })).toBe('invalid_body');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest app/api/learning/stats/route.test.ts --no-coverage
```

Expected: FAIL — `mapLearningError` and `validateLearningBody` not found.

- [ ] **Step 3: Create the route**

```typescript
// app/api/learning/stats/route.ts
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface LearningBody {
  totalAttempted: number;
  totalCorrect: number;
  itemAttempted: number;
  itemCorrect: number;
  actionAttempted: number;
  actionCorrect: number;
}

export function mapLearningError(msg: string): { status: number; body: object } {
  if (msg === 'unauthorized') return { status: 401, body: { error: 'Unauthorized' } };
  if (msg === 'invalid_body') return { status: 400, body: { error: 'Invalid request body' } };
  console.error('[learning/stats] unexpected error:', msg);
  return { status: 500, body: { error: 'Server error' } };
}

export function validateLearningBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'invalid_body';
  const b = body as Record<string, unknown>;
  const fields: (keyof LearningBody)[] = [
    'totalAttempted', 'totalCorrect',
    'itemAttempted', 'itemCorrect',
    'actionAttempted', 'actionCorrect',
  ];
  for (const f of fields) {
    if (typeof b[f] !== 'number' || !Number.isInteger(b[f]) || (b[f] as number) < 0) {
      return 'invalid_body';
    }
  }
  if ((b.totalCorrect as number) > (b.totalAttempted as number)) return 'invalid_body';
  if ((b.itemCorrect as number) > (b.itemAttempted as number)) return 'invalid_body';
  if ((b.actionCorrect as number) > (b.actionAttempted as number)) return 'invalid_body';
  return null;
}

export async function POST(request: NextRequest) {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) {
    const e = mapLearningError('unauthorized');
    return NextResponse.json(e.body, { status: e.status });
  }

  let body: unknown;
  try { body = await request.json(); } catch { body = null; }

  const validationError = validateLearningBody(body);
  if (validationError) {
    const e = mapLearningError(validationError);
    return NextResponse.json(e.body, { status: e.status });
  }

  const b = body as LearningBody;
  const { error } = await server.rpc('record_learning_session', {
    p_total_attempted:  b.totalAttempted,
    p_total_correct:    b.totalCorrect,
    p_item_attempted:   b.itemAttempted,
    p_item_correct:     b.itemCorrect,
    p_action_attempted: b.actionAttempted,
    p_action_correct:   b.actionCorrect,
  });

  if (error) {
    const e = mapLearningError('server_error');
    return NextResponse.json(e.body, { status: e.status });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest app/api/learning/stats/route.test.ts --no-coverage
```

Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/learning/stats/route.ts app/api/learning/stats/route.test.ts
git commit -m "feat: add POST /api/learning/stats route with validation"
```

---

## Task 3: LearningModePrompt — Equation Reveal

**Files:**
- Modify: `components/LearningModePrompt.tsx`

The current component calls `onCorrect()` (no args) immediately when the player types the right answer. This task changes it to:
1. Flip into a "correct" reveal state showing the completed equation
2. Auto-dismiss after 3 seconds
3. Allow the player to click the backdrop to close early
4. Call `onCorrect(wasFirstAttempt: boolean)` instead of `onCorrect()`

`computeCardValue` is already imported from `@/lib/GameEngine`.

- [ ] **Step 1: Replace the entire file**

```typescript
// components/LearningModePrompt.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { FieldCard as FieldCardType, Card } from '@/lib/types';
import { computeCardValue, computeExpectedValue } from '@/lib/GameEngine';

interface Props {
  fieldCard: FieldCardType;
  modifierCard: Card;
  onCorrect: (wasFirstAttempt: boolean) => void;
  onDismiss: () => void;
}

export default function LearningModePrompt({ fieldCard, modifierCard, onCorrect, onDismiss }: Props) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [wasFirst, setWasFirst] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expected = computeExpectedValue(fieldCard, modifierCard);

  // Auto-dismiss after 3 seconds once in correct state
  useEffect(() => {
    if (!correct) return;
    const timer = setTimeout(() => onCorrect(wasFirst), 3000);
    return () => clearTimeout(timer);
  }, [correct, wasFirst, onCorrect]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const answer = parseFloat(input.trim());
    if (answer === expected) {
      const firstTry = !wrong;
      setWasFirst(firstTry);
      setCorrect(true);
    } else {
      setWrong(true);
      setInput('');
      inputRef.current?.focus();
    }
  }

  const before = computeCardValue(fieldCard);
  const operatorStr = modifierCard.type === 'item'
    ? `${(modifierCard.operator_value ?? 0) >= 0 ? '+' : ''}${modifierCard.operator_value}`
    : `× ${modifierCard.operator_value}`;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={correct ? () => onCorrect(wasFirst) : undefined}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: `2px solid ${correct ? '#388e3c' : '#5c6bc0'}`,
          boxShadow: correct ? '0 0 24px rgba(56,142,60,0.35)' : undefined,
          borderRadius: 16, padding: '28px 32px', maxWidth: 380, width: '90%',
          fontFamily: 'sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {correct ? (
          <>
            <div style={{ fontSize: '2em', textAlign: 'center', marginBottom: 8 }}>✅</div>
            <h2 style={{ color: '#a5d6a7', margin: '0 0 16px', fontSize: '1.1em', textAlign: 'center' }}>
              Correct!
            </h2>
            <div style={{
              background: '#0d1a0d', border: '1px solid #388e3c',
              borderRadius: 10, padding: '16px 20px', marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, fontSize: '1.5em', fontFamily: 'monospace', fontWeight: 700,
              }}>
                <span style={{ color: '#fff' }}>{before}</span>
                <span style={{
                  color: modifierCard.type === 'item' ? '#a5d6a7' : '#ce93d8',
                  fontSize: '0.85em',
                }}>
                  {operatorStr}
                </span>
                <span style={{ color: '#888', fontSize: '0.85em' }}>=</span>
                <span style={{ color: '#ffd54f', fontSize: '1.15em' }}>{expected}</span>
              </div>
              <div style={{ color: '#888', fontSize: '0.75em', marginTop: 6 }}>
                {fieldCard.card.name} · {modifierCard.name}
              </div>
            </div>
            <div style={{ color: '#66bb6a', fontSize: '0.85em', fontWeight: 600, textAlign: 'center' }}>
              Tap anywhere to continue…
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.6em', textAlign: 'center', marginBottom: 8 }}>🧮</div>
            <h2 style={{ color: '#ffd54f', margin: '0 0 6px', fontSize: '1.1em', textAlign: 'center' }}>
              Learning Mode
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.9em', textAlign: 'center', margin: '0 0 20px' }}>
              What is the new value of <strong style={{ color: '#fff' }}>{fieldCard.card.name}</strong>?
            </p>
            <div style={{ background: '#0d0d1a', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.9em' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #222' }}>
                <span style={{ color: '#888' }}>Current value</span>
                <span style={{ color: '#fff', fontFamily: 'monospace' }}>{computeCardValue(fieldCard)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                <span style={{ color: '#888' }}>
                  {modifierCard.type === 'item' ? 'Add' : 'Multiply by'} ({modifierCard.name})
                </span>
                <span style={{ color: modifierCard.type === 'item' ? '#a5d6a7' : '#ce93d8', fontFamily: 'monospace' }}>
                  {(modifierCard.operator ?? String(modifierCard.operator_value ?? '')).replace('÷', '/')}
                </span>
              </div>
            </div>
            {wrong && (
              <div style={{ background: '#2a0a0a', border: '1px solid #7f0000', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85em' }}>
                <div style={{ color: '#ef9a9a', fontWeight: 700, marginBottom: 4 }}>Not quite! Here&apos;s how it works:</div>
                <div style={{ color: '#ccc' }}>
                  Current value: <strong>{computeCardValue(fieldCard)}</strong>
                  {modifierCard.type === 'item' && (
                    <span> {(modifierCard.operator_value ?? 0) >= 0 ? '+' : ''}{modifierCard.operator_value} = <strong style={{ color: '#ffd54f' }}>{expected}</strong></span>
                  )}
                  {(modifierCard.type === 'action' || modifierCard.type === 'event') && (
                    <span> × {modifierCard.operator_value} = <strong style={{ color: '#ffd54f' }}>{expected}</strong></span>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="number"
                step="any"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter your answer..."
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '1.1em',
                  background: '#0d0d1a', border: `2px solid ${wrong ? '#c62828' : '#2a2a5a'}`,
                  borderRadius: 8, color: '#fff', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 12,
                }}
              />
              <button
                type="submit"
                style={{
                  width: '100%', padding: '10px', fontSize: '1em',
                  background: '#1a237e', color: '#fff', border: '2px solid #5c6bc0',
                  borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                }}
              >
                Check Answer →
              </button>
            </form>
            <button
              onClick={onDismiss}
              style={{ marginTop: 10, width: '100%', padding: '7px', fontSize: '0.85em', background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: 8, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Run the full test suite to check nothing broke**

```bash
npx jest --no-coverage
```

Expected: all existing tests still pass (LearningModePrompt has no unit tests, so no new failures expected).

- [ ] **Step 3: Commit**

```bash
git add components/LearningModePrompt.tsx
git commit -m "feat: add equation reveal to LearningModePrompt (3s auto-dismiss, backdrop close)"
```

---

## Task 4: GameBoardV2 — Accumulate Learning Stats

**Files:**
- Modify: `components/GameBoardV2.tsx`

This task:
1. Exports a `LearningStats` interface
2. Adds a `learningStatsRef` that accumulates totals during the game
3. Increments `total` counters when a learning prompt appears
4. Increments `correct` counters via the updated `onCorrect(wasFirstAttempt)` callback
5. Passes `learningStats` to `GameOverScreen` for display
6. Passes `learningStats` to `onNewGame` so parent pages can POST to the API

- [ ] **Step 1: Add the `LearningStats` interface and ref — find the Props interface (around line 375) and add above it**

Find this line:
```typescript
// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
```

Add immediately before it:
```typescript
export interface LearningStats {
  total: number;
  correct: number;
  item: { total: number; correct: number };
  action: { total: number; correct: number };
}

function emptyLearningStats(): LearningStats {
  return { total: 0, correct: 0, item: { total: 0, correct: 0 }, action: { total: 0, correct: 0 } };
}

```

- [ ] **Step 2: Update the `onNewGame` prop type in the Props interface**

Find:
```typescript
  onNewGame: () => void;
```

Replace with:
```typescript
  onNewGame: (learningStats: LearningStats | null) => void;
```

- [ ] **Step 3: Add the `learningStatsRef` — find where other refs are declared (around line 393, near `learningCheck` state)**

Find this line (it's just after the component function opens):
```typescript
  const [learningCheck,    setLearningCheck]    = useState<{ fieldCard: FieldCardType; modifierCard: Card; onConfirm: () => void } | null>(null);
```

Add immediately after it:
```typescript
  const learningStatsRef = useRef<LearningStats>(emptyLearningStats());
```

- [ ] **Step 4: Add a helper to increment total when a prompt appears — create this function inside the component, after `learningStatsRef` is declared**

```typescript
  function trackLearningPrompt(modifierCard: Card) {
    learningStatsRef.current.total += 1;
    if (modifierCard.type === 'item')   learningStatsRef.current.item.total += 1;
    if (modifierCard.type === 'action') learningStatsRef.current.action.total += 1;
  }
```

- [ ] **Step 5: Call `trackLearningPrompt` at each of the four places where `setLearningCheck` is called**

**Place 1** (around line 519 — item/action in `handleFieldCardClick`):

Find:
```typescript
      if (state.learningMode) { setModalData(null); setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
```

Replace with:
```typescript
      if (state.learningMode) { setModalData(null); trackLearningPrompt(selectedCard); setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
```

**Place 2** (around line 532 — mirror event):

Find:
```typescript
        if (state.learningMode && effect === 'mirror') { setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
```

Replace with:
```typescript
        if (state.learningMode && effect === 'mirror') { trackLearningPrompt(selectedCard); setLearningCheck({ fieldCard: fc, modifierCard: selectedCard, onConfirm: doPlay }); return; }
```

**Place 3** (around line 543 — x100/reverse/square events with syntheticMod):

Find:
```typescript
        setLearningCheck({ fieldCard: fc, modifierCard: syntheticMod, onConfirm: doPlay }); return;
```

Replace with:
```typescript
        trackLearningPrompt(syntheticMod); setLearningCheck({ fieldCard: fc, modifierCard: syntheticMod, onConfirm: doPlay }); return;
```

**Place 4** (around line 557 — drag-and-drop in `handleDropOnFieldCard`):

Find:
```typescript
      if (state.learningMode) setLearningCheck({ fieldCard: fc, modifierCard: card, onConfirm: doPlay });
```

Replace with:
```typescript
      if (state.learningMode) { trackLearningPrompt(card); setLearningCheck({ fieldCard: fc, modifierCard: card, onConfirm: doPlay }); }
```

- [ ] **Step 6: Update the `LearningModePrompt` render to use the new `onCorrect(wasFirstAttempt)` signature**

Find (around line 864):
```typescript
      {learningCheck && (
        <LearningModePrompt
          fieldCard={learningCheck.fieldCard}
          modifierCard={learningCheck.modifierCard}
          onCorrect={learningCheck.onConfirm}
          onDismiss={() => setLearningCheck(null)}
        />
      )}
```

Replace with:
```typescript
      {learningCheck && (
        <LearningModePrompt
          fieldCard={learningCheck.fieldCard}
          modifierCard={learningCheck.modifierCard}
          onCorrect={(wasFirstAttempt) => {
            if (wasFirstAttempt) {
              learningStatsRef.current.correct += 1;
              const t = learningCheck.modifierCard.type;
              if (t === 'item')   learningStatsRef.current.item.correct += 1;
              if (t === 'action') learningStatsRef.current.action.correct += 1;
            }
            setLearningCheck(null);
            learningCheck.onConfirm();
          }}
          onDismiss={() => setLearningCheck(null)}
        />
      )}
```

- [ ] **Step 7: Update the `GameOverScreen` render to pass `learningStats` and updated `onNewGame`**

Find (around line 872):
```typescript
      {gameOver && winner && (
        <GameOverScreen
          winner={winner}
          playerScore={playerScore}
          opponentScore={oppScore}
          onNewGame={onNewGame}
          questsCompleted={questsCompleted}
        />
      )}
```

Replace with:
```typescript
      {gameOver && winner && (
        <GameOverScreen
          winner={winner}
          playerScore={playerScore}
          opponentScore={oppScore}
          onNewGame={() => onNewGame(
            state.learningMode && learningStatsRef.current.total > 0
              ? { ...learningStatsRef.current, item: { ...learningStatsRef.current.item }, action: { ...learningStatsRef.current.action } }
              : null
          )}
          questsCompleted={questsCompleted}
          learningStats={
            state.learningMode && learningStatsRef.current.total > 0
              ? { ...learningStatsRef.current, item: { ...learningStatsRef.current.item }, action: { ...learningStatsRef.current.action } }
              : null
          }
        />
      )}
```

- [ ] **Step 8: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass. TypeScript will compile because existing callers of `onNewGame` (e.g. `() => setState(null)`) are compatible — functions with fewer parameters than the declared type are assignable in TypeScript.

- [ ] **Step 9: Commit**

```bash
git add components/GameBoardV2.tsx
git commit -m "feat: accumulate learning stats in GameBoardV2, pass to GameOverScreen and onNewGame"
```

---

## Task 5: GameOverScreen — Learning Stats Summary Panel

**Files:**
- Modify: `components/GameOverScreen.tsx`

- [ ] **Step 1: Add the import and update the Props interface**

Find the top of the file:
```typescript
'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Side } from '@/lib/types';
import confetti from 'canvas-confetti';

interface Props {
  winner: Side | 'tie';
  playerScore: number;
  opponentScore: number;
  onNewGame: () => void;
  questsCompleted?: string[];
}
```

Replace with:
```typescript
'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Side } from '@/lib/types';
import type { LearningStats } from './GameBoardV2';
import confetti from 'canvas-confetti';

interface Props {
  winner: Side | 'tie';
  playerScore: number;
  opponentScore: number;
  onNewGame: () => void;
  questsCompleted?: string[];
  learningStats?: LearningStats | null;
}
```

- [ ] **Step 2: Update the function signature to destructure `learningStats`**

Find:
```typescript
export default function GameOverScreen({ winner, playerScore, opponentScore, onNewGame, questsCompleted }: Props) {
```

Replace with:
```typescript
export default function GameOverScreen({ winner, playerScore, opponentScore, onNewGame, questsCompleted, learningStats }: Props) {
```

- [ ] **Step 3: Insert the learning stats panel — find the Play Again button (it's the only `onClick={onNewGame}` in the file) and insert the panel immediately above it**

Find:
```typescript
        <button
          onClick={onNewGame}
```

Insert immediately before that `<button>` line:

```typescript
          {/* Learning stats panel */}
          {learningStats && learningStats.total > 0 && (
            <div style={{
              marginTop: 16, background: '#0d0d1a',
              border: '1px solid #5c6bc0', borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '1.1em' }}>🧮</span>
                <span style={{ color: '#ce93d8', fontSize: '0.85em', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Learning Mode
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #222' }}>
                <span style={{ color: '#aaa', fontSize: '0.85em' }}>First-try correct</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1em' }}>
                  {learningStats.correct}{' '}
                  <span style={{ color: '#555', fontWeight: 400 }}>/ {learningStats.total}</span>
                </span>
              </div>
              <div style={{ background: '#1a1a3a', borderRadius: 6, height: 6, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #66bb6a, #a5d6a7)',
                  height: '100%',
                  width: `${Math.round((learningStats.correct / learningStats.total) * 100)}%`,
                  borderRadius: 6,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {learningStats.item.total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: '#1b5e20', color: '#a5d6a7', fontSize: '0.7em', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>+ −</span>
                      <span style={{ color: '#888', fontSize: '0.82em' }}>Addition / Subtraction</span>
                    </div>
                    <span style={{ color: '#a5d6a7', fontSize: '0.85em', fontWeight: 600 }}>
                      {learningStats.item.correct} / {learningStats.item.total}
                    </span>
                  </div>
                )}
                {learningStats.action.total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: '#4a148c', color: '#ce93d8', fontSize: '0.7em', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>× ÷</span>
                      <span style={{ color: '#888', fontSize: '0.82em' }}>Multiplication / Division</span>
                    </div>
                    <span style={{ color: '#ce93d8', fontSize: '0.85em', fontWeight: 600 }}>
                      {learningStats.action.correct} / {learningStats.action.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
```

- [ ] **Step 4: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/GameOverScreen.tsx
git commit -m "feat: add learning stats summary panel to GameOverScreen"
```

---

## Task 6: app/game/page.tsx — POST Stats on Game End

**Files:**
- Modify: `app/game/page.tsx`

When the player clicks "Play Again" in a learning mode game, `onNewGame` is called with `LearningStats | null`. This task fires the POST to `/api/learning/stats` before resetting the game state.

- [ ] **Step 1: Find and update the `onNewGame` handler**

Find (around line 767):
```typescript
        onNewGame={() => setState(null)}
```

Replace with:
```typescript
        onNewGame={(ls) => {
          if (ls && ls.total > 0) {
            fetch('/api/learning/stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                totalAttempted:  ls.total,
                totalCorrect:    ls.correct,
                itemAttempted:   ls.item.total,
                itemCorrect:     ls.item.correct,
                actionAttempted: ls.action.total,
                actionCorrect:   ls.action.correct,
              }),
            }).catch(console.error);
          }
          setState(null);
        }}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/game/page.tsx
git commit -m "feat: POST learning stats to API on game end in game page"
```

---

## Task 7: app/v2/page.tsx — POST Stats on Game End

**Files:**
- Modify: `app/v2/page.tsx`

Same pattern as Task 6 — `app/v2/page.tsx` also supports learning mode.

- [ ] **Step 1: Find and update the `onNewGame` handler**

Find (around line 515):
```typescript
        onNewGame={() => setState(null)}
```

Replace with:
```typescript
        onNewGame={(ls) => {
          if (ls && ls.total > 0) {
            fetch('/api/learning/stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                totalAttempted:  ls.total,
                totalCorrect:    ls.correct,
                itemAttempted:   ls.item.total,
                itemCorrect:     ls.item.correct,
                actionAttempted: ls.action.total,
                actionCorrect:   ls.action.correct,
              }),
            }).catch(console.error);
          }
          setState(null);
        }}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/v2/page.tsx
git commit -m "feat: POST learning stats to API on game end in v2 page"
```

---

## Task 8: Profile Page — Learning Stats Section

**Files:**
- Modify: `app/profile/page.tsx`

- [ ] **Step 1: Add the `learningStats` state — find the existing state declarations (around line 52)**

Find:
```typescript
  const [dailyQuests,   setDailyQuests]   = useState<DailyQuest[]>([]);
```

Add immediately after:
```typescript
  const [learningStats, setLearningStats] = useState<{
    total_attempted: number; total_correct: number;
    item_attempted: number; item_correct: number;
    action_attempted: number; action_correct: number;
  } | null>(null);
```

- [ ] **Step 2: Add the Supabase fetch to the existing Promise.all — find the parallel fetch block (around line 69)**

Find:
```typescript
        const [{ data: streakRows, error: streakErr }, { data: finishedGames, error: gamesErr }, { data: playerDecks, error: decksErr }] = await Promise.all([
          supabase.rpc('get_player_stats', { p_player_id: user.id }),
          supabase
            .from('games')
            .select('player1_id, winner_id, state_json')
            .eq('status', 'finished')
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .limit(500),
          supabase
            .from('decks')
            .select('id, name')
            .eq('player_id', user.id),
        ]);
        if (streakErr || gamesErr || decksErr) throw new Error('Stats query failed');
```

Replace with:
```typescript
        const [{ data: streakRows, error: streakErr }, { data: finishedGames, error: gamesErr }, { data: playerDecks, error: decksErr }, { data: lsRow }] = await Promise.all([
          supabase.rpc('get_player_stats', { p_player_id: user.id }),
          supabase
            .from('games')
            .select('player1_id, winner_id, state_json')
            .eq('status', 'finished')
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .limit(500),
          supabase
            .from('decks')
            .select('id, name')
            .eq('player_id', user.id),
          supabase
            .from('player_learning_stats')
            .select('total_attempted,total_correct,item_attempted,item_correct,action_attempted,action_correct')
            .eq('player_id', user.id)
            .maybeSingle(),
        ]);
        if (streakErr || gamesErr || decksErr) throw new Error('Stats query failed');
        if (lsRow) setLearningStats(lsRow as typeof learningStats);
```

- [ ] **Step 3: Add the LEARNING STATS section to the render — find the GAME STATS closing tag**

Find the end of the GAME STATS block. It ends with:
```typescript
        </div>
      )}

      {/* Daily Quests */}
```

Insert the learning stats section between them:
```typescript
        </div>
      )}

      {/* Learning Stats */}
      {learningStats && learningStats.total_attempted > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{
            fontFamily: "'Spectral', serif", color: '#c9a84c',
            fontSize: '1em', marginBottom: 12, textAlign: 'center', letterSpacing: '0.08em',
          }}>
            LEARNING STATS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                label: 'Overall Accuracy',
                value: `${Math.round((learningStats.total_correct / learningStats.total_attempted) * 100)}%`,
              },
              {
                label: 'Total Attempts',
                value: String(learningStats.total_attempted),
              },
              ...(learningStats.item_attempted > 0 ? [{
                label: 'Addition / Sub.',
                value: `${Math.round((learningStats.item_correct / learningStats.item_attempted) * 100)}%`,
              }] : []),
              ...(learningStats.action_attempted > 0 ? [{
                label: 'Multiplication / Div.',
                value: `${Math.round((learningStats.action_correct / learningStats.action_attempted) * 100)}%`,
              }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10,
                padding: '12px 14px',
              }}>
                <div style={{ color: '#555', fontSize: '0.7em', fontFamily: "'Spectral', serif", letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ color: '#ddd', fontSize: '0.95em', fontFamily: "'Spectral', serif", fontWeight: 600 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Quests */}
```

- [ ] **Step 4: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/profile/page.tsx
git commit -m "feat: add LEARNING STATS section to player profile"
```
