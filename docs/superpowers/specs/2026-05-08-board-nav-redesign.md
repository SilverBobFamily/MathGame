# Board & Nav Visual Redesign

**Date:** 2026-05-08  
**Branch:** feature/auth-game-options-sudden-death  
**Status:** Approved — ready for implementation

---

## Summary

Two scoped visual upgrades driven by the Stitch AI board design (session `97202-1778287745`):

1. **Nav redesign** — upgrade the existing text-link nav to icon + label tabs, top on desktop, bottom on mobile.
2. **Game board visual redesign** — replace the current uniform dark-purple board with a two-tone (crimson/navy) dual-zone board: wooden frame border, gold divider, real card art, prominent per-player score badges.

No gameplay logic changes. No new routes. Purely visual.

---

## 1. Nav Redesign

### Current state
`app/layout.tsx` renders a `<nav>` with plain text `<a>` links. The Mathemagic logo is a large SVG (`height: 108`) anchored left. Links: Play, Play Online, My Games, Cards, Settings, (Admin), profile avatar + username, Sign Out.

### Target state
Icon + label tab strip, styled like the Stitch design's bottom nav (Material Symbols icons, Cinzel labels). On desktop it stays at the top; on mobile it moves to the bottom of the viewport (fixed) so thumbs can reach it. The logo remains top-left on desktop; on mobile it's replaced by a centered wordmark in the top bar since the tab strip is at the bottom.

### Nav items (icons from Material Symbols Outlined)
| Route | Label | Icon |
|-------|-------|------|
| `/game` | Play | `swords` |
| `/lobby` | Online | `group` |
| `/games` | My Games | `history` |
| `/cards` | Cards | `auto_stories` |
| `/settings` | Settings | `settings` |
| `/admin` | Admin | `admin_panel_settings` (shown only for admins) |

Profile avatar + sign-out stay in the top-right corner on both breakpoints (not in the tab strip).

### Visual spec
- Background: `#111` / border: `1px solid #222`
- Active tab: gold accent `#c9a84c`, icon weight `FILL=1`
- Inactive: `#555`, icon weight `FILL=0`
- Icon size: 22px, label: 10px Cinzel, letter-spacing 0.08em
- Desktop: `height: 56px`, horizontal strip, logo left, tabs center, profile right
- Mobile (`max-width: 768px`): top bar shows logo + profile only (`height: 44px`); bottom fixed strip shows tabs only (`height: 60px`, `padding-bottom: env(safe-area-inset-bottom)`)
- Active tab detection: compare `pathname` with route prefix

### Files changed
- `app/layout.tsx` — replace `<nav>` contents; add Material Symbols font link; add `<style>` block for responsive tab strip

---

## 2. Game Board Visual Redesign

### Current state
`components/GameBoardV2.tsx` — single dark-indigo background, uniform card styling, score shown as a number in a badge. No player color distinction. Cards use emoji art when `art_url` is absent.

### Target state
Two visually distinct zones separated by a gold divider. Wooden-frame border. Each player has a color identity that runs through their zone background, score badge, field card borders, and hand card borders.

### Zone layout (top → bottom)
```
┌─────────────────────────────────────────────────┐  ← wooden frame border
│  [Opponent score badge]     [Opponent hand ×N]  │  ← crimson zone
│  ┌─────────────────────────────────────────┐    │
│  │  OPPONENT FIELD  [card][card][card]      │    │
│  └─────────────────────────────────────────┘    │
├─ ── ── ── ── ✦ ROUND 3 · YOUR TURN ✦ ── ── ── ─┤  ← gold divider
│  ┌─────────────────────────────────────────┐    │
│  │  YOUR FIELD  [card][card][card]          │    │
│  └─────────────────────────────────────────┘    │
│  [Your score badge]         [Your hand cards]   │  ← navy zone
└─────────────────────────────────────────────────┘
```

### Color palette
| Element | Opponent (crimson) | Player (navy) |
|---------|-------------------|---------------|
| Zone bg | `#2b0505 → #450a0a` | `#05051a → #0a0a2b` |
| Score badge bg | `#2a0808` | `#080e2a` |
| Score badge border | `#7a1a1a` (dim) / `#ef5350` (winning) | `#1a2a7a` (dim) / `#5c6bc0` (winning) |
| Score badge text | `#e87070` | `#90caf9` |
| Field border | `rgba(180,40,40,0.15)` | `rgba(40,60,200,0.15)` |
| Card border (creature) | `#6a2020` | `#1a2a7a` |

Card type tinting (same for both players):
- Item: `#2e7d32` border
- Action: `#6a1b9a` border
- Event: `#7f0000` border

### Wooden frame
CSS `border-image` gradient simulating a dark wood frame, 12px solid. Corner filigree: `❈` pseudo-element in gold `#c9a84c` at `opacity: 0.5`. Applied to the outer board wrapper.

### Gold divider
`height: 2px`, `background: linear-gradient(90deg, transparent, #c9a84c 20%, #c9a84c 80%, transparent)`. Centered pill: `✦ ROUND N · YOUR TURN ✦` in Cinzel 9px, gold, `background: #1a0a3a`, bordered gold.

### Score badges
Large, prominent — `font-size: 2em`, Cinzel 900 weight. Positioned inline with the hand/deck row. No progress bar. Show raw score number. `box-shadow` glow when winning.

### Cards on field (`FieldCard.tsx`)
- Aspect ratio ~2:3 (portrait), width ~72px field / ~58px hand
- Art section: top ~55% of card — `<img src={card.art_url}` `object-fit: cover`. No emoji fallback in the new board (if no art_url, show a dark placeholder with card name initial).
- Value section: bottom ~25% — large Cinzel number, colored per player
- Name strip: bottom ~20% — tiny Cinzel, truncated
- Modifier pip: absolute top-right, green (+N) or purple (×N)
- Hover (hand cards only): `translateY(-14px) scale(1.05)`, `z-index: 20`

### Hand cards (opponent)
Shown face-down: dark card back with subtle diagonal stripe pattern, colored per opponent theme. Count shown in deck pill.

### Files changed
- `components/GameBoardV2.tsx` — full visual rework of layout, zones, divider, score badges
- `components/FieldCard.tsx` — update to portrait layout with real-art-first display, no emoji in new board context
- No changes to `GameEngine.ts`, game state, or data layer

---

## Out of scope
- Card dragging bug (separate issue, separate fix)
- Multiplayer-specific board differences
- Sudden death UI
- Any new game mechanics

---

## Open questions for implementation
1. Does `GameBoardV2.tsx` currently receive the active player color context, or does it derive it from game state? (Needed to know which zone gets the "winning" badge glow.)
2. Cards without `art_url` — placeholder image or skip the art section entirely?
