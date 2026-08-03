# ColorQuest Kids 2.2 release summary

Release date: August 3, 2026  
Web version: 2.2.0  
Android version: 2.2 (`versionCode` 5)

## Headline changes

- **Fifi the Color Spark:** original local mascot art and accessible in-app guidance for drawing exits, autosave, start-over, and one-time creative tips.
- **No browser-origin drawing warning:** all studio exit routes now open Fifi; the child can stay or leave knowing the private draft will restore.
- **Better drawing on phones:** canvas-first layout, sticky Brushes / Base paint / Shapes dock, debounced draft saves, coalesced storage writes, and safe shape editing.
- **Puzzle variety repaired:** the visible board now uses the deduplicated puzzle deck; every advertised puzzle page is unique before the deck repeats.
- **Age-aware narration:** automatically chosen high-quality English voices, different delivery profiles for the four age worlds, a Parent Corner voice picker, and truthful on-device/network labels.
- **More content can be heard:** puzzle choices, lab predictions/materials/steps/observations, concept stories, and every Discovery story/imagination/math card.
- **Release hardening:** versioned offline cache, forced fresh asset checks, no production source maps, Android R8/resource shrinking, and synced Android assets.

## Verified here

- `npm run check`: **44/44 tests passed**, TypeScript passed, production web build passed.
- `npm audit --omit=dev`: **0 vulnerabilities**.
- `npm run android:sync`: Android-targeted web build passed and copied successfully.
- No `.map` files in the web or Android asset bundles.

## Still required on your computer

Open the included `android/` folder in Android Studio, let it download Gradle/SDK dependencies, run on a physical phone, and create a signed release `.aab`. Follow `ANDROID_RELEASE.md`; a signed native release cannot be produced here without your private signing key.

## GitHub Pages update

Copy the release files into the root of the existing `colorquest-kids` repository, preserving `.github/workflows/deploy-pages.yml`, then commit and push to `main`. Do not upload `node_modules`. GitHub Actions will run `npm ci`, build, and deploy the site.

