# ColorQuest Kids 2.4 storybooks and deeper learning

Release date: August 4, 2026  
Web version: 2.4.0  
Android version: 2.4.0 (`versionCode` 8)

## Headline changes

- **Six original picture books:** three books for ages 1–3 and three for ages 4–6, with 24 original local illustrations, funny four-page stories, narration, vocabulary, and imagination prompts.
- **Self-paced reading:** children can hear one page or the whole book, revisit any page, switch books from the shelf, and record completion only when they choose.
- **Older Math expansion:** ages 7–9 and 10–12 now have 12 concepts each, including decimals, measurement, coordinates, patterns, rates, and two-step equations.
- **Older Science expansion:** the two older worlds now offer 15 and 16 labs with broader physics, chemistry, life, Earth, climate, sound, and astronomy coverage.
- **Layered lab explanations:** new vocabulary and real-world connections appear after prediction, steps, and evidence—not before.
- **Cuter Fifi:** brighter age-aware character delivery, a larger squash-and-stretch multi-hop, sparkle trail, gentle floating, and synchronized talking mouth.
- **Fresh offline rollout:** all 24 story images are in the versioned offline shell, and the Fifi greeting marker is refreshed for this release.

- **Fifi the Color Spark:** original local mascot art and accessible in-app guidance for drawing exits, autosave, start-over, and one-time creative tips.
- **Fifi comes alive:** short hop-in greeting, comic speech callout, synchronized mouth pose, and a cuter character voice layered over the existing age-aware narration.
- **No browser-origin drawing warning:** all studio exit routes now open Fifi; the child can stay or leave knowing the private draft will restore.
- **Better drawing on phones:** canvas-first layout, sticky Brushes / Base paint / Shapes dock, debounced draft saves, coalesced storage writes, and safe shape editing.
- **Puzzle variety repaired:** the visible board now uses the deduplicated puzzle deck; every advertised puzzle page is unique before the deck repeats.
- **Age-aware narration:** automatically chosen high-quality English voices, different delivery profiles for the four age worlds, a Parent Corner voice picker, and truthful on-device/network labels.
- **More content can be heard:** puzzle choices, lab predictions/materials/steps/observations, concept stories, and every Discovery story/imagination/math card.
- **Release hardening:** versioned offline cache, forced fresh asset checks, no production source maps, Android R8/resource shrinking, and synced Android assets.

## Verified here

- `npm run check`: **60/60 tests passed**, TypeScript passed, production web build passed.
- `npm audit --omit=dev`: **0 vulnerabilities**.
- `npm run android:sync`: Android-targeted web build passed and copied successfully.
- No `.map` files in the web or Android asset bundles.
- Built GitHub Pages preview served Fifi's local art, storybook CSS, a bundled story image, and the v2.4 offline manifest successfully.

## Still required on your computer

Open the included `android/` folder in Android Studio, let it download Gradle/SDK dependencies, run on a physical phone, and create a signed release `.aab`. Follow `ANDROID_RELEASE.md`; a signed native release cannot be produced here without your private signing key.

## GitHub Pages update

Copy the release files into the root of the existing `colorquest-kids` repository, preserving `.github/workflows/deploy-pages.yml`, then commit and push to `main`. Do not upload `node_modules`. GitHub Actions will run `npm ci`, build, and deploy the site.
