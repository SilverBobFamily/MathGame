# Math Learning Focus — Design Spec

## Goal

Enhance Learning Mode with three additions: an equation reveal on correct answer, a per-session summary in the post-game screen, and lifetime learning stat persistence with a section on the player profile.

## Architecture

Six pieces, each self-contained:

1. **Migration** — `player_learning_stats` table + `record_learning_session()` RPC
2. **`LearningModePrompt`** — equation reveal state on correct answer (3s auto-dismiss, backdrop click to close)
3. **`GameBoardV2`** — accumulate session stats in a ref; surface via updated callbacks
4. **`GameOverScreen`** — session summary panel when learning stats are present
5. **`POST /api/learning/stats`** — validate and persist session stats via RPC
6. **`app/profile/page.tsx`** — LEARNING STATS section below GAME STATS

---

## 1. Database

### Table: `player_learning_stats`

One row per player, all counters accumulated lifetime.

```sql
create table public.player_learning_stats (
  player_id        uuid primary key references public.players(id) on delete cascade,
  total_attempted  integer not null default 0,
  total_correct    integer not null default 0,
  item_attempted   integer not null default 0,  -- +/− item cards
  item_correct     integer not null default 0,
  action_attempted integer not null default 0,  -- ×/÷ action cards
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
```

### RPC: `record_learning_session()`

Atomically increments all columns; inserts a new row on first call.

```sql
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

---

## 2. `LearningModePrompt` changes

**File:** `components/LearningModePrompt.tsx`

### Updated prop signature

```typescript
interface Props {
  fieldCard: FieldCardType;
  modifierCard: Card;
  onCorrect: (wasFirstAttempt: boolean) => void;  // was () => void
  onDismiss: () => void;
}
```

### New `correct` state

```typescript
const [correct, setCorrect] = useState(false);
```

### On submit — correct answer

Capture `wasFirstAttempt` at submission time (before any state update) to avoid stale closure in the timer:

```typescript
if (answer === expected) {
  const firstTry = !wrong;   // snapshot before any state change
  setCorrect(true);
  setWasFirst(firstTry);     // store in state so the timer/backdrop can read it cleanly
} else {
  setWrong(true);
  setInput('');
  inputRef.current?.focus();
}
```

`wasFirst` is a boolean state initialised to `false`; it is only written once (when the correct answer is submitted).

### Equation reveal view

Shown when `correct === true`. Replaces the form. Auto-dismisses after 3000ms:

```typescript
useEffect(() => {
  if (!correct) return;
  const timer = setTimeout(() => onCorrect(wasFirst), 3000);
  return () => clearTimeout(timer);
}, [correct, wasFirst, onCorrect]);
```

Backdrop click (the outer overlay `div`) calls `onCorrect(wasFirst)` immediately when `correct` is true. In the normal (non-correct) state, backdrop click does nothing — the player must answer or press Cancel.

### Equation string

```typescript
const before = computeCardValue(fieldCard);

// displayed as e.g. "5 + 3 = 8" or "5 × 2 = 10"
const operatorStr =
  modifierCard.type === 'item'
    ? `${(modifierCard.operator_value ?? 0) >= 0 ? '+' : ''}${modifierCard.operator_value}`
    : `× ${modifierCard.operator_value}`;
```

Reveal layout:

```
✅  Correct!

┌──────────────────────────┐
│   5   +   3   =   8      │  ← monospace, color-coded
│   Volcanix + Fire Boost  │  ← card names, small grey
└──────────────────────────┘

Tap anywhere to continue…
```

Colors: `before` white, operator green for items / purple for actions, `=` grey, `expected` yellow (`#ffd54f`). Border and shadow switch from `#5c6bc0` to `#388e3c` (green) in the correct state.

---

## 3. `GameBoardV2` changes

**File:** `components/GameBoardV2.tsx`

### Session stats ref

```typescript
interface LearningStats {
  total: number;
  correct: number;
  item: { total: number; correct: number };
  action: { total: number; correct: number };
}

const learningStatsRef = useRef<LearningStats>({
  total: 0, correct: 0,
  item: { total: 0, correct: 0 },
  action: { total: 0, correct: 0 },
});
```

### When a prompt appears

Increment `total` and the appropriate type counter immediately (before the player answers):

```typescript
learningStatsRef.current.total += 1;
if (modifierCard.type === 'item')   learningStatsRef.current.item.total += 1;
if (modifierCard.type === 'action') learningStatsRef.current.action.total += 1;
```

### On `onCorrect(wasFirstAttempt)`

```typescript
if (wasFirstAttempt) {
  learningStatsRef.current.correct += 1;
  if (modifierCard.type === 'item')   learningStatsRef.current.item.correct += 1;
  if (modifierCard.type === 'action') learningStatsRef.current.action.correct += 1;
  // event cards: counted in total/correct but not item/action breakdown
}
```

Event cards (`modifierCard.type === 'event'`) are included in `total` and `correct` but excluded from the `item`/`action` sub-counters, since their effects (zero, square, swap, etc.) don't map to a single arithmetic operator.

### When game ends

GameBoardV2 already has an `onNewGame` prop used by parent pages. Pass `learningStatsRef.current` as a second argument when `learningMode` is true and `total > 0`:

```typescript
// existing call: onNewGame?.()
// becomes:
onNewGame?.(learningMode && learningStatsRef.current.total > 0
  ? learningStatsRef.current
  : null);
```

Update `onNewGame` prop type accordingly: `onNewGame?: (learningStats: LearningStats | null) => void`.

Pass `learningStatsRef.current` (or null) to `GameOverScreen` via existing props so the summary panel can render.

---

## 4. `GameOverScreen` changes

**File:** `components/GameOverScreen.tsx`

### New optional prop

```typescript
learningStats?: LearningStats | null;
```

### Summary panel

Rendered below the score comparison, only when `learningStats` is present and `learningStats.total > 0`:

```
🧮  LEARNING MODE
────────────────────────────────
First-try correct       8 / 12
[████████████░░░░░░]  66%

+ −  Addition / Subtraction    4 / 5
× ÷  Multiplication / Division  4 / 7
```

- Progress bar width: `(correct / total) * 100`%
- Operator rows only shown when `item.total > 0` or `action.total > 0` respectively
- Colors match the mockup: item row green (`#a5d6a7`), action row purple (`#ce93d8`)

---

## 5. `POST /api/learning/stats`

**Files:**
- Create: `app/api/learning/stats/route.ts`
- Create: `app/api/learning/stats/route.test.ts`

### Request body

```typescript
{
  totalAttempted: number;
  totalCorrect: number;
  itemAttempted: number;
  itemCorrect: number;
  actionAttempted: number;
  actionCorrect: number;
}
```

### Validation

All six fields must be non-negative integers. `totalCorrect <= totalAttempted`, `itemCorrect <= itemAttempted`, `actionCorrect <= actionAttempted`. Return 400 on violation.

### Handler

```typescript
export async function POST(request: NextRequest) {
  const server = await createServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  // validate...

  const { error } = await server.rpc('record_learning_session', {
    p_total_attempted:  body.totalAttempted,
    p_total_correct:    body.totalCorrect,
    p_item_attempted:   body.itemAttempted,
    p_item_correct:     body.itemCorrect,
    p_action_attempted: body.actionAttempted,
    p_action_correct:   body.actionCorrect,
  });

  if (error) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

### Calling the API

Any page that uses `GameBoardV2` with `learningMode={true}` passes a handler to `onNewGame`. When `learningStats` is non-null and user is authenticated, POST to `/api/learning/stats`. This currently applies to the main game page and the campaign chapter page. Both already have `onNewGame`/`handleGameEnd` handlers.

---

## 6. Player Profile — Learning Section

**File:** `app/profile/page.tsx`

### Data fetch

Add to the existing parallel fetch block:

```typescript
supabase
  .from('player_learning_stats')
  .select('*')
  .eq('player_id', user.id)
  .maybeSingle()
```

Store in `learningStats` state.

### Render

Add a LEARNING STATS section below the GAME STATS block, only when `learningStats` exists and `learningStats.total_attempted > 0`:

```
LEARNING STATS

Overall accuracy        67%    (8 / 12)
Addition / Subtraction  80%    (4 / 5)
Multiplication / Div    57%    (4 / 7)
```

Rendered as stat tiles matching the existing GAME STATS grid style (`background: '#0d0d0d'`, `border: '1px solid #1e1e1e'`, `borderRadius: 10`, `padding: '12px 14px'`).

---

## Testing

### `app/api/learning/stats/route.test.ts`

- Returns 401 when unauthenticated
- Returns 400 when body is missing fields
- Returns 400 when `itemCorrect > itemAttempted`
- Returns 400 when any field is negative
- Returns 200 `{ ok: true }` on valid input

### `lib/__tests__/learningStats.test.ts` (optional unit test)

Test the validation logic extracted into a pure helper `validateLearningBody(body)`:
- Valid body → `null`
- Missing field → error string
- Correct > attempted → error string

---

## Data Flow Summary

```
Player plays learning mode game
  └─ LearningModePrompt fires onCorrect(wasFirstAttempt)
       └─ GameBoardV2 accumulates learningStatsRef
            └─ Game ends → onNewGame(learningStats)
                 └─ Parent page: POST /api/learning/stats
                      └─ record_learning_session() increments player_learning_stats
                 └─ GameOverScreen receives learningStats → shows summary panel
app/profile/page.tsx fetches player_learning_stats → shows LEARNING STATS section
```
