# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light mode toggle that respects system preference, persists in localStorage, and has zero flash on load.

**Architecture:** Inline blocking `<script>` in `<head>` sets `data-theme` on `<html>` before first paint (prevents flash). CSS custom properties keyed to `[data-theme]` control colors. A `useTheme` hook manages reading/writing localStorage and toggling the attribute.

**Tech Stack:** Next.js 16.2.4 App Router, React hooks, CSS custom properties, localStorage, `prefers-color-scheme` media query.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `hooks/useTheme.ts` | CREATE | Reads/writes localStorage + `data-theme` attribute, exposes `{ theme, toggle }` |
| `hooks/__tests__/useTheme.test.ts` | CREATE | Tests for useTheme hook |
| `components/ThemeToggle.tsx` | CREATE | Sun/moon button that calls `useTheme().toggle()` |
| `components/__tests__/ThemeToggle.test.tsx` | CREATE | Tests for ThemeToggle |
| `app/globals.css` | MODIFY | Add dark/light CSS variable sets keyed to `[data-theme]` |
| `app/layout.tsx` | MODIFY | Add inline flash-prevention script + `suppressHydrationWarning` + use CSS vars on body |
| `components/NavBar.tsx` | MODIFY | Replace hardcoded `#111`/`#1e1e1e` with CSS vars |
| `app/settings/page.tsx` | MODIFY | Add Appearance section with `<ThemeToggle />` |

---

## Task 1: CSS Variables

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add theme CSS variable blocks to globals.css**

  Replace the existing `:root` and `@media (prefers-color-scheme: dark)` blocks (lines 3–20) with:

  ```css
  :root, [data-theme="dark"] {
    --background: #0d0d1a;
    --foreground: #eee;
    --theme-bg: #0d0d1a;
    --theme-bg-nav: #111111;
    --theme-text: #eeeeee;
    --theme-text-muted: #555555;
    --theme-border: #1e1e1e;
  }

  [data-theme="light"] {
    --background: #f0f0f8;
    --foreground: #1a1a2e;
    --theme-bg: #f0f0f8;
    --theme-bg-nav: #ffffff;
    --theme-text: #1a1a2e;
    --theme-text-muted: #666666;
    --theme-border: #d0d0e0;
  }
  ```

  The `@theme inline` block and `html`/`body` rules below remain unchanged.

- [ ] **Step 2: Commit**

  ```bash
  git add app/globals.css
  git commit -m "feat: add dark/light CSS variable sets"
  ```

---

## Task 2: useTheme Hook (TDD)

**Files:**
- Create: `hooks/__tests__/useTheme.test.ts`
- Create: `hooks/useTheme.ts`

- [ ] **Step 1: Write the failing tests**

  Create `hooks/__tests__/useTheme.test.ts`:

  ```typescript
  import { renderHook, act } from '@testing-library/react';
  import { useTheme } from '../useTheme';

  const mockMatchMedia = (prefersDark: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn((query: string) => ({
        matches: prefersDark && query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  };

  describe('useTheme', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
      mockMatchMedia(true);
    });

    it('defaults to dark when system prefers dark and no stored theme', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('defaults to light when system prefers light and no stored theme', () => {
      mockMatchMedia(false);
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });

    it('uses stored theme from localStorage over system preference', () => {
      localStorage.setItem('mathemagic-theme', 'light');
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });

    it('toggle() flips dark to light', () => {
      localStorage.setItem('mathemagic-theme', 'dark');
      const { result } = renderHook(() => useTheme());
      act(() => { result.current.toggle(); });
      expect(result.current.theme).toBe('light');
    });

    it('toggle() flips light to dark', () => {
      localStorage.setItem('mathemagic-theme', 'light');
      const { result } = renderHook(() => useTheme());
      act(() => { result.current.toggle(); });
      expect(result.current.theme).toBe('dark');
    });

    it('toggle() persists new theme in localStorage', () => {
      localStorage.setItem('mathemagic-theme', 'dark');
      const { result } = renderHook(() => useTheme());
      act(() => { result.current.toggle(); });
      expect(localStorage.getItem('mathemagic-theme')).toBe('light');
    });

    it('toggle() updates data-theme attribute on <html>', () => {
      localStorage.setItem('mathemagic-theme', 'dark');
      const { result } = renderHook(() => useTheme());
      act(() => { result.current.toggle(); });
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npm test -- --testPathPattern="useTheme" 2>&1
  ```

  Expected: FAIL with "Cannot find module '../useTheme'"

- [ ] **Step 3: Implement useTheme hook**

  Create `hooks/useTheme.ts`:

  ```typescript
  'use client';
  import { useEffect, useState, useCallback } from 'react';

  const STORAGE_KEY = 'mathemagic-theme';
  export type Theme = 'dark' | 'light';

  function getSystemTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  }

  export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() =>
      getStoredTheme() ?? getSystemTheme()
    );

    useEffect(() => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (!getStoredTheme()) {
          const next: Theme = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', next);
          setThemeState(next);
        }
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }, []);

    const toggle = useCallback(() => {
      setThemeState(prev => {
        const next: Theme = prev === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.setAttribute('data-theme', next);
        return next;
      });
    }, []);

    return { theme, toggle };
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npm test -- --testPathPattern="useTheme" 2>&1
  ```

  Expected: 7 tests PASS

- [ ] **Step 5: Commit**

  ```bash
  git add hooks/useTheme.ts hooks/__tests__/useTheme.test.ts
  git commit -m "feat: add useTheme hook with localStorage persistence"
  ```

---

## Task 3: ThemeToggle Component (TDD)

**Files:**
- Create: `components/__tests__/ThemeToggle.test.tsx`
- Create: `components/ThemeToggle.tsx`

- [ ] **Step 1: Write the failing tests**

  Create `components/__tests__/ThemeToggle.test.tsx`:

  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react';
  import ThemeToggle from '../ThemeToggle';

  jest.mock('@/hooks/useTheme');
  import { useTheme } from '@/hooks/useTheme';

  describe('ThemeToggle', () => {
    it('shows aria-label "Switch to light mode" when theme is dark', () => {
      (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggle: jest.fn() });
      render(<ThemeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('shows aria-label "Switch to dark mode" when theme is light', () => {
      (useTheme as jest.Mock).mockReturnValue({ theme: 'light', toggle: jest.fn() });
      render(<ThemeToggle />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('calls toggle when clicked', () => {
      const toggle = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({ theme: 'dark', toggle });
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button'));
      expect(toggle).toHaveBeenCalledTimes(1);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npm test -- --testPathPattern="ThemeToggle" 2>&1
  ```

  Expected: FAIL with "Cannot find module '../ThemeToggle'"

- [ ] **Step 3: Implement ThemeToggle**

  Create `components/ThemeToggle.tsx`:

  ```typescript
  'use client';
  import { useTheme } from '@/hooks/useTheme';

  export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    return (
      <button
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          background: 'transparent',
          border: '1px solid var(--theme-border)',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          color: 'var(--theme-text)',
          fontSize: '1.1em',
        }}
      >
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    );
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npm test -- --testPathPattern="ThemeToggle" 2>&1
  ```

  Expected: 3 tests PASS

- [ ] **Step 5: Commit**

  ```bash
  git add components/ThemeToggle.tsx components/__tests__/ThemeToggle.test.tsx
  git commit -m "feat: add ThemeToggle component"
  ```

---

## Task 4: Flash-Prevention Script in Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update app/layout.tsx**

  Add `suppressHydrationWarning` to `<html>`, add the inline script, and replace the hardcoded body background/color with CSS vars:

  ```typescript
  import type { Metadata } from 'next';
  import './globals.css';
  import { createSupabaseServerClient } from '@/lib/supabase-server';
  import NavBar from '@/components/NavBar';

  export const metadata: Metadata = {
    title: 'Mathemagic',
    description: 'A collectible card game where the math is the magic.',
  };

  const themeScript = `
    try {
      var t = localStorage.getItem('mathemagic-theme');
      if (!t) {
        t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
  `.trim();

  export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let username: string | null = null;
    let avatarUrl: string | null = null;
    let isAdmin = false;
    if (user) {
      const { data } = await supabase
        .from('players')
        .select('username, avatar_url, is_admin')
        .eq('id', user.id)
        .single();
      username = data?.username ?? null;
      avatarUrl = (data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
      isAdmin = (data as { is_admin?: boolean } | null)?.is_admin ?? false;
    }

    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        </head>
        <body style={{ margin: 0, background: 'var(--theme-bg)', color: 'var(--theme-text)', fontFamily: "'Crimson Text', serif", minHeight: '100vh' }}>
          <NavBar
            username={username}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            isSignedIn={!!user}
          />
          <div style={{ fontSize: '0.67em' }}>{children}</div>
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/layout.tsx
  git commit -m "feat: add flash-prevention theme script to layout"
  ```

---

## Task 5: NavBar Theme Vars

**Files:**
- Modify: `components/NavBar.tsx`

- [ ] **Step 1: Replace hardcoded bg/border colors in NavBar with CSS vars**

  In `components/NavBar.tsx`, find the three nav container `div` style objects and replace hardcoded values:

  - Replace `background: '#111'` → `background: 'var(--theme-bg-nav)'` (2 occurrences: desktop nav and mobile top bar)
  - Replace `borderBottom: '1px solid #1e1e1e'` → `borderBottom: '1px solid var(--theme-border)'` (2 occurrences)
  - Replace `background: '#111'` on mobile bottom bar → `background: 'var(--theme-bg-nav)'`
  - Replace `borderTop: '1px solid #1e1e1e'` → `borderTop: '1px solid var(--theme-border)'`

  The full updated style objects:

  Desktop nav div (line ~124):
  ```tsx
  style={{
    background: 'var(--theme-bg-nav)', borderBottom: '1px solid var(--theme-border)',
    padding: '0 36px', height: '102px',
    alignItems: 'center', gap: '30px',
  }}
  ```

  Mobile top bar div (line ~139):
  ```tsx
  style={{
    background: 'var(--theme-bg-nav)', borderBottom: '1px solid var(--theme-border)',
    padding: '0 16px', height: '44px',
    alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 50,
  }}
  ```

  Mobile bottom bar div (line ~152):
  ```tsx
  style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
    background: 'var(--theme-bg-nav)', borderTop: '1px solid var(--theme-border)',
    height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
    alignItems: 'center', justifyContent: 'space-around',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
  }}
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/NavBar.tsx
  git commit -m "feat: use CSS vars for nav bg/border colors"
  ```

---

## Task 6: Add ThemeToggle to Settings Page

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Add Appearance section to settings**

  In `app/settings/page.tsx`, add `import ThemeToggle from '@/components/ThemeToggle';` at the top, then add a new section before the existing `<h2>Active Releases</h2>`. The updated file:

  ```typescript
  'use client';
  import { useEffect, useState } from 'react';
  import { fetchReleases } from '@/lib/supabase';
  import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
  import { getActiveReleaseIds, setActiveReleaseIds } from '@/lib/releases';
  import type { Release } from '@/lib/types';
  import ThemeToggle from '@/components/ThemeToggle';

  export default function SettingsPage() {
    const [releases, setReleases] = useState<Release[]>([]);
    const [activeIds, setActiveIds] = useState<number[]>([]);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
      const supabase = createSupabaseBrowserClient();
      fetchReleases(supabase).then(r => {
        setReleases(r);
        const stored = getActiveReleaseIds();
        setActiveIds(stored ?? r.map(rel => rel.id));
      });
    }, []);

    const toggle = (id: number) => {
      setSaved(false);
      setActiveIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const save = () => {
      setActiveReleaseIds(activeIds);
      setSaved(true);
    };

    const tooFew = activeIds.length < 2;

    return (
      <div style={{ padding: '32px 28px', maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ color: 'var(--theme-text)', marginTop: 0, fontFamily: "'Cinzel', serif" }}>Settings</h1>

        <h2 style={{ color: 'var(--theme-text-muted)', fontSize: '1.05em', marginBottom: 12, fontFamily: "'Cinzel', serif" }}>
          Appearance
        </h2>
        <div style={{ marginBottom: 32 }}>
          <ThemeToggle />
        </div>

        <h2 style={{ color: '#ccc', fontSize: '1.05em', marginBottom: 12, fontFamily: "'Cinzel', serif" }}>
          Active Releases
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => { setSaved(false); setActiveIds(releases.map(r => r.id)); }}
            style={{ background: '#222', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85em' }}
          >
            Select All
          </button>
          <button
            onClick={() => { setSaved(false); setActiveIds([]); }}
            style={{ background: '#222', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85em' }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {releases.map(r => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              style={{
                background: activeIds.includes(r.id) ? r.color_hex : '#111',
                color: '#fff',
                border: `2px solid ${r.color_hex}`,
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: activeIds.includes(r.id) ? 700 : 400,
              }}
            >
              {r.icon} {r.name}
            </button>
          ))}
        </div>

        {tooFew && (
          <p style={{ color: '#ef5350', fontSize: '0.9em', margin: '0 0 16px' }}>
            Select at least 2 releases to play.
          </p>
        )}

        <button
          onClick={save}
          disabled={tooFew}
          style={{
            background: tooFew ? '#1a1a1a' : '#1a237e',
            color: tooFew ? '#444' : '#fff',
            border: `2px solid ${tooFew ? '#333' : '#5c6bc0'}`,
            borderRadius: 10,
            padding: '12px 28px',
            fontSize: '1em',
            cursor: tooFew ? 'not-allowed' : 'pointer',
          }}
        >
          Save as Default
        </button>

        {saved && (
          <span style={{ marginLeft: 16, color: '#81c784', fontSize: '0.9em' }}>Saved!</span>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/settings/page.tsx
  git commit -m "feat: add ThemeToggle to settings page"
  ```

---

## Task 7: Full Verification

- [ ] **Step 1: Run all tests**

  ```bash
  npm test 2>&1
  ```

  Expected: All test suites pass (≥67 tests: 60 existing + 7 useTheme + 3 ThemeToggle)

- [ ] **Step 2: Run build**

  ```bash
  npm run build 2>&1
  ```

  Expected: exit 0, all routes compiled successfully

- [ ] **Step 3: Final commit if anything was missed**

  ```bash
  git status
  ```

  If clean, no commit needed. If files remain unstaged, add and commit them.
