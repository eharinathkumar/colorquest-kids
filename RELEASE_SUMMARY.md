# ColorQuest Kids 2.5.0 adaptive Math release

Release date: August 5, 2026  
Web version: 2.5.0  
Android version: 2.5.0 (`versionCode` 10)

## Headline changes

- **Fresh questions, not a fixed quiz:** every Math concept generates changing values, visual groups, stories, and shuffled choices.
- **Per-child repeat memory:** each profile remembers its recent question signatures and avoids the latest 48; a five-question mini-quest also guards its own active session.
- **Exact-age starting points:** ages 4, 5, and 6 no longer start with identical ranges, and the same principle extends through age 12.
- **Evidence before promotion:** challenge rises only after three of the latest four questions were solved on the first try, including the latest two, across at least two representations.
- **Gentle recovery:** two first-try misses add concrete support; sustained difficulty can lower the working level without deleting earlier achievement.
- **Meaningful readiness:** “Ready for a new challenge” requires five of six first-try successes across two quests and three representations—not one lucky tap.
- **Youngest-child care:** ages 1–2 receive two-choice, unscored Play & notice prompts; age 3 begins with two accessible choices.
- **Transparent parent view:** Parent Corner reports fresh questions tried and independent first-try successes without grades or child comparisons.

- **One child-friendly map:** Home and Studio now use the same Create, Play & Read, and Learn & Discover grouping.
- **Age-safe exploration:** storybooks appear only in the two younger worlds and Discovery appears only in the two older worlds; invalid saved destinations fall back safely.
- **No surprise page loops:** previous/next controls stop at the boundaries and clearly mark the end of a catalog.
- **Story narration repaired:** a book title is automatically spoken on the opening page only, rather than before every page.
- **Dead-link protection:** automated tests restrict outside resources to approved HTTPS education hosts; all four current NASA, NOAA, and PhET destinations were also opened successfully on August 5, 2026.

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

- `npm run check`: **78/78 tests passed**, TypeScript passed, production web build passed.
- `npm audit --omit=dev`: **0 vulnerabilities**.
- `npm run android:sync`: Android-targeted web build passed and copied successfully.
- No `.map` files in the web or Android asset bundles.
- Final web and Android bundles contain Fifi's local art, storybook CSS, all 24 story images, and the v2.5.0 offline manifest.

## Still required on your computer

Open the included `android/` folder in Android Studio, let it download Gradle/SDK dependencies, run on a physical phone, and create a signed release `.aab`. Follow `ANDROID_RELEASE.md`; a signed native release cannot be produced here without your private signing key.

## GitHub Pages update

Copy the release files into the root of the existing `colorquest-kids` repository, preserving `.github/workflows/deploy-pages.yml`, then commit and push to `main`. Do not upload `node_modules`. GitHub Actions will run `npm ci`, build, and deploy the site.
