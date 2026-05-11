# Mathemagic Backlog

Format: `- [ ] FEATURE_TITLE — acceptance: WHAT_MUST_BE_TRUE_TO_CALL_IT_DONE`
Order matters — top is next. Mark `[x]` to skip. Add new items anytime.

## Next up
- [ ] Compress the 7.4MB logo PNG — acceptance: `public/mathemagic-logo-bg.png` ≤300KB at the same visible quality (use WebP or aggressive PNG optimization), `app/page.tsx` still renders the logo correctly, all Jest tests pass
- [ ] Dark mode toggle — acceptance: respects system preference, persists in localStorage, no flash on load, all Jest tests pass
- [ ] Sound effects toggle in settings — acceptance: persists across sessions, default on, all Jest tests pass

## Later
- [ ] Optimize and integrate generated card art — acceptance:
    - All 2,290 PNGs in `art-output/release-*/` compressed (WebP, quality 80) to ≤100KB each
    - Optimized images placed in `public/assets/cards/release-{N}/{card-id}-{slug}.webp`
    - `lib/` provides a typed `getCardArtUrl(cardId): string` helper
    - Game UI uses the helper to display card art on the card browser
    - Total `public/assets/cards/` size <300MB
    - All Jest tests still pass
    - Lighthouse mobile performance score ≥85 on the card browser page
