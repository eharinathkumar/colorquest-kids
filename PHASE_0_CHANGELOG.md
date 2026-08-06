# ColorQuest Kids — Phase 0 quick wins

The first slice of the 3.0 roadmap: cheap, high-impact UX and accessibility fixes,
none of which touch the privacy posture, storage model, or content pipeline. All
changes are additive and covered by the existing plus new automated tests.

**Verification:** `npm run check` → 71/71 tests pass (65 original + 6 new),
TypeScript clean, production build clean. Additionally verified in a real Chromium
browser across the 1–3 and 7–9 age worlds with zero console errors.

## What changed

**1. Fifi is made of the same paint as the app.**
`FifiGuide.css` previously defined its own near-duplicate color tokens
(`--fifi-purple` etc.). They now derive from the global palette (`:root` in
`styles.css`) via `var(--grape)` / `var(--coral)` / `var(--navy)` with safe
fallbacks, so there is a single source of truth and Fifi visibly belongs to the
same system.

**2. Reduced-motion verified (no code change needed).**
Contrary to an earlier design note, `styles.css` already has a comprehensive
global `prefers-reduced-motion` reset (`*, *::before, *::after { animation: none
!important }`), and `FifiGuide.css` layers a specific block naming the sparkle,
mouth, and mascot. Confirmed nothing decorative slips past; no JS-driven motion.

**3. Accessible color swatches.**
Both the Coloring board and the Drawing Studio labelled swatches
`aria-label="Choose #hex"` — meaningless to a screen-reader or low-vision child.
Now every swatch has a plain-language name ("Choose red"), an `aria-pressed`
selection state, a `title` tooltip, and a **non-color checkmark** on the active
swatch so selection is never signalled by color alone. The two duplicated hex
arrays are unified into one `color-names.ts` module.

**4. Arrows-only navigation for the youngest world (ages 1–3).**
A toddler cannot type into a number field. In age world 0 the numeric page input
is replaced with a read-only "Page 1 of 10" display; the ← / → arrows are the only
way to move. Older worlds keep the number input.

**5. Fifi's tip auto-opens only for ages 1–6.**
For 7–12, a self-opening mascot reads as babyish, so the per-activity tip becomes
opt-in: an **"Ask Fifi"** button that is badge-lit until the child has seen the
tip. The show-once-per-activity storage mechanism is unchanged.

**6. A real celebration for the youngest.**
Finishing a coloring scene is the biggest emotional payoff in the app. For ages
1–6 the plain `success-toast` becomes a Fifi character moment (mascot + sparkle
burst + "You did it!"). Older ages keep the concise toast.

**7. Novelty cues, from data the app already tracks.**
A **"✨ New to you"** marker shows on items the child hasn't finished, and a
**"✨ Surprise me"** button jumps straight to an unseen item instead of paging
through sequentially. Logic lives in a small, fully unit-tested `novelty.ts`
(deterministic given a seed).

## New files
- `src/color-names.ts` — single palette + plain-language color names.
- `src/novelty.ts` — unseen-item helpers for the novelty cues.
- `src/novelty.test.ts` — 6 tests covering the helpers.

## Notes for the release
- The version in `package.json` was intentionally **not** bumped, to avoid
  touching the service-worker cache name and Android `versionCode` outside a
  deliberate release. Bump to `2.5.0` when cutting the actual release and update
  the offline cache marker per the existing process in `ANDROID_RELEASE.md`.
- No storage schema changed, so no profile migration is required for Phase 0.
  The completion-key fix and content-pack work are Phase 1 (see the 3.0 vision).
