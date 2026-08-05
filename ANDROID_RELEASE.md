# ColorQuest Kids Android release

The Android project wraps the same tested ColorQuest experience and bundles its web files inside the application. It does not load the GitHub Pages site as its main screen.

Release target: **ColorQuest Kids 2.4.1**, `versionCode` **9**. Google Play requires every uploaded bundle to use a version code higher than all earlier uploads.

## What is ready

- Application ID: `com.harinath.colorquestkids`
- App name: ColorQuest Kids
- Android source: `android/`
- Android-targeted web build generated with relative asset paths (copy it into the native project with the final `npm run android:sync`)
- Multiple on-device child profiles with age-personalized starting worlds and separate progress
- Self-paced resume points with no streaks, deadlines, or locked lesson path
- Layered Drawing Studio with eight brushes, six base paints, and movable/editable vector shapes
- Fifi's in-app autosave/start-over guide replaces browser-origin confirmation alerts and works as a mobile bottom sheet
- Fifi now hops in, speaks through a comic callout, and animates his mouth while his age-aware character voice is active
- Six narrated, illustrated, offline storybooks for ages 1–3 and 4–6, with vocabulary and imagination prompts
- Storybook auto-reading says the title once on the opening page, then reads only the current page
- Consistent Create, Play & Read, and Learn & Discover paths on both Home and Studio
- Age-safe resume routing plus bounded previous/next navigation with a clear end state
- Age-aware narration, selectable English voices, and expanded puzzle/lab/Discovery read-aloud coverage
- Private on-device artwork gallery with parent-controlled Android share/export
- Six varied puzzle mechanics with age-specific content: matching, sorting, sequencing, patterns, odd-one-out, and clue solving
- 72 guided Math and Science concepts, including 12 Math concepts in each older age world
- Gentle on-device mentor paths based on age, progress, and voluntary **I liked this** signals
- 47 age-specific hands-on Science Labs with explicit safety levels and prediction-to-explanation flow
- Alternate explanations, four-frame concept stories, stronger hints, curated grown-up-gated resources, and an age-aware book shelf
- Automated tests for profile onboarding, age routing, progress isolation, drawing layers, editable shapes, gallery/export, coloring, puzzle variety, guided learning, Science Labs, mentor recommendations, and 400 distinct Discovery Lab missions
- No advertising, child account, chat, location, camera, microphone, contacts, or broad storage permission
- Native picture saving uses Android's save/share sheet and an app-private temporary file
- Puzzle counters and the visible puzzle board share one deduplicated deck, with a regression test covering every advertised page
- Discovery Lab art is bundled and generated locally; it no longer performs live image searches
- Production JavaScript source maps are disabled
- Android release minification and resource shrinking are enabled; retain the release mapping file for diagnostics

## Test on a Windows computer and Android phone

1. Install Android Studio 2025.2.1 or newer.
2. During setup, install Android SDK 36 and an Android 16 emulator image.
3. In this project folder, run `npm ci`.
4. Run `npm run android:sync`.
5. Open Android Studio and select the `android` folder.
6. Connect an Android phone with USB debugging enabled, or create an API 36 emulator.
7. Press the green Run button.

The normal Android Studio **Run** button creates a debug build and does not prove the release shrinker works. Before uploading, also choose **Build → Generate Signed Bundle / APK → Android App Bundle** and build the release variant.

## Physical-device test checklist

- Open and close the app five times; no blank screen.
- Try portrait and landscape on a phone and tablet.
- Test all four age groups.
- Create two profiles of different ages, switch between them, and verify their resume positions remain separate.
- Close and reopen the app; confirm profiles, progress, and artwork remain available.
- Try every brush, base paint, and color with both finger and stylus if available.
- Test Tiny, Small, Big, and Giant brush presets, then fine-adjust the slider.
- Place every shape near all four canvas edges; move, resize, rotate, duplicate, recolor, and remove it.
- Test **Undo** and **New page** after combining brush strokes, shapes, and base paint.
- Draw a stroke, then try every way out of the studio; confirm Fifi appears, **Stay & draw** keeps the canvas, and **Keep it safe and leave** restores the draft later.
- Color at least one complete animal, tulip garden, and landscape.
- Read one picture book in each younger age world; test page narration, whole-story narration, page dots, bookshelf switching, and completion tracking.
- Complete at least one matching, sorting, sequencing, pattern, odd-one-out, and clue-solving puzzle.
- Page through the complete advertised puzzle total in each age world and confirm no puzzle repeats before the final page.
- Open Math and Science in all four age worlds. Answer one concept correctly and try one incorrect answer in each.
- Confirm the younger Math/Science trails have eight concepts and the older Math trails have 12, all with readable explanations, vocabulary, and an off-screen activity.
- Open **Explain it another way**, play and pause a concept story, answer incorrectly, and verify the hint is useful without revealing the answer.
- Finish a lesson, tap **I liked this**, return home, and confirm the mentor reflects the growing interest.
- Open Science Lab in every age world. Confirm the safety level is prominent and the explanation stays locked until prediction and steps are complete.
- Open one curated learning link and confirm the grown-up check appears before the external link.
- Open Discovery Lab pages 1, 80, 81, 160, 240, 320, and 400.
- Turn on airplane mode and confirm drawing, coloring, and puzzles still work.
- With read-aloud enabled, test at least two installed voices. Confirm speech stops after leaving a screen, backgrounding the app, or turning read-aloud off. Voice quality and local/offline support vary by device.
- Save artwork to the private gallery, open Parent Corner, then download/share and print it.
- Confirm children cannot reach download, print, profile editing, or gallery deletion without the grown-up check.
- Leave the app, return after five minutes, and confirm the current activity remains usable.

## Before Google Play closed testing

- After all web/UI/content changes are integrated, run `npm run android:sync` exactly once and confirm the generated Android assets contain no `.map` files.
- Create the signed Android App Bundle (`.aab`) in Android Studio.
- Confirm the signed release bundle builds successfully with R8 minification and resource shrinking; investigate warnings instead of disabling shrinking globally.
- Archive `android/app/build/outputs/mapping/release/mapping.txt` with the corresponding bundle so release crash traces can be decoded.
- Keep the upload key and passwords private and backed up.
- Complete the privacy policy, Data safety, Target audience, Families policy, and IARC content-rating forms.
- Publish `PRIVACY_POLICY.md` at a stable public URL and use that URL in Play Console.
- Prepare phone and tablet screenshots, feature graphic, short description, and full description.
- Use the closed track with at least 12 opted-in testers for at least 14 days if the Play Console account is a new personal account.
