# ColorQuest Kids Android release

The Android project wraps the same tested ColorQuest experience and bundles its web files inside the application. It does not load the GitHub Pages site as its main screen.

## What is ready

- Application ID: `com.harinath.colorquestkids`
- App name: ColorQuest Kids
- Android source: `android/`
- Web build copied into the native app
- Multiple on-device child profiles with age-personalized starting worlds and separate progress
- Self-paced resume points with no streaks, deadlines, or locked lesson path
- Layered Drawing Studio with eight brushes, six base paints, and movable/editable vector shapes
- Private on-device artwork gallery with parent-controlled Android share/export
- Six varied puzzle mechanics with age-specific content: matching, sorting, sequencing, patterns, odd-one-out, and clue solving
- 64 guided Math and Science concepts: eight per subject in each of four age worlds
- Gentle on-device mentor paths based on age, progress, and voluntary **I liked this** signals
- 32 age-specific hands-on Science Labs with explicit safety levels and prediction-to-explanation flow
- Alternate explanations, four-frame concept stories, stronger hints, curated grown-up-gated resources, and an age-aware book shelf
- Automated tests for profile onboarding, age routing, progress isolation, drawing layers, editable shapes, gallery/export, coloring, puzzle variety, guided learning, Science Labs, mentor recommendations, and 400 distinct Discovery Lab missions
- No advertising, child account, chat, location, camera, microphone, contacts, or broad storage permission
- Native picture saving uses Android's save/share sheet and an app-private temporary file

## Test on a Windows computer and Android phone

1. Install Android Studio 2025.2.1 or newer.
2. During setup, install Android SDK 36 and an Android 16 emulator image.
3. In this project folder, run `npm ci`.
4. Run `npm run android:sync`.
5. Open Android Studio and select the `android` folder.
6. Connect an Android phone with USB debugging enabled, or create an API 36 emulator.
7. Press the green Run button.

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
- Color at least one complete animal, tulip garden, and landscape.
- Complete at least one matching, sorting, sequencing, pattern, odd-one-out, and clue-solving puzzle.
- Open Math and Science in all four age worlds. Answer one concept correctly and try one incorrect answer in each.
- Confirm each Math/Science trail has eight concepts, readable explanations, vocabulary, and an off-screen activity.
- Open **Explain it another way**, play and pause a concept story, answer incorrectly, and verify the hint is useful without revealing the answer.
- Finish a lesson, tap **I liked this**, return home, and confirm the mentor reflects the growing interest.
- Open Science Lab in every age world. Confirm the safety level is prominent and the explanation stays locked until prediction and steps are complete.
- Open one curated learning link and confirm the grown-up check appears before the external link.
- Open Discovery Lab pages 1, 80, 81, 160, 240, 320, and 400.
- Turn on airplane mode and confirm drawing, coloring, and puzzles still work.
- Save artwork to the private gallery, open Parent Corner, then download/share and print it.
- Confirm children cannot reach download, print, profile editing, or gallery deletion without the grown-up check.
- Leave the app, return after five minutes, and confirm the current activity remains usable.

## Before Google Play closed testing

- Create the signed Android App Bundle (`.aab`) in Android Studio.
- Keep the upload key and passwords private and backed up.
- Complete the privacy policy, Data safety, Target audience, Families policy, and IARC content-rating forms.
- Publish `PRIVACY_POLICY.md` at a stable public URL and use that URL in Play Console.
- Prepare phone and tablet screenshots, feature graphic, short description, and full description.
- Use the closed track with at least 12 opted-in testers for at least 14 days if the Play Console account is a new personal account.
