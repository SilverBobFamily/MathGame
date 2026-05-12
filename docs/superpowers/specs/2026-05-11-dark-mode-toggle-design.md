# Dark Mode Toggle — Design Spec
**Date:** 2026-05-11

## Acceptance Criteria
- Respects system preference (`prefers-color-scheme`)
- Persists explicit user choice in `localStorage`
- No flash on load (theme applied before first paint)

## Architecture

### Flash Prevention (critical)
An inline blocking `<script>` in `<head>` reads `localStorage.getItem('mathemagic-theme')` (or falls back to system preference) and sets `document.documentElement.setAttribute('data-theme', ...)` before the body renders. The `<html>` element needs `suppressHydrationWarning` to silence the server/client mismatch.

### CSS Variables
`app/globals.css` gains two theme blocks:
- `:root, [data-theme="dark"]` — current dark values (default, game aesthetic)
- `[data-theme="light"]` — light values for users who prefer light

Key variables: `--theme-bg`, `--theme-bg-nav`, `--theme-text`, `--theme-text-muted`, `--theme-border`.

`app/layout.tsx` body style and `components/NavBar.tsx` nav backgrounds are updated to use these vars.

### useTheme Hook (`hooks/useTheme.ts`)
- Reads current theme from `document.documentElement.dataset.theme`
- Exposes `toggle()` that flips theme and persists to localStorage
- Listens for system preference changes (updates when no explicit preference stored)

### ThemeToggle Component (`components/ThemeToggle.tsx`)
- Client component, uses `useTheme`
- Renders a sun/moon icon button
- `aria-label` changes to describe the action ("Switch to light mode" / "Switch to dark mode")

### Integration
- `app/settings/page.tsx` — add ThemeToggle in a new "Appearance" section
- `components/NavBar.tsx` — no toggle needed here (Settings is the home for this)

## Files Changed
1. `app/layout.tsx` — add inline script + `suppressHydrationWarning` + update body style vars
2. `app/globals.css` — add theme CSS variables
3. `components/NavBar.tsx` — use CSS vars for nav bg/border
4. `hooks/useTheme.ts` — NEW
5. `components/ThemeToggle.tsx` — NEW
6. `app/settings/page.tsx` — add Appearance section with ThemeToggle

## localStorage Key
`mathemagic-theme` — values: `"dark"` | `"light"` | absent (system preference)
