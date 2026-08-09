# ColorQuest Kids 2.7.0 test report

Date: August 8, 2026  
Build target: Android 2.7.0 (`versionCode` 14)  
Application ID: `com.harinath.colorquestkids`

## Automated result

**PASS — 86 of 86 tests across nine test files.** `npm run check` completed successfully: TypeScript passed and the production GitHub Pages build completed. `npm run android:sync` then rebuilt the Android-targeted web app and copied it into the native project successfully.

Focused-workspace coverage verifies that opening an activity removes the Home launcher, old studio sidebar, and age controls; the compact Back and activity-switch controls remain available.

The production dependency audit reports **0 known vulnerabilities**. No JavaScript source maps exist in `dist/` or `android/app/src/main/assets/public/`.

## Creative Studio coverage

- Draw and Color appear together in one Creative Studio path and mode switch
- Children leave drawing through every navigation route without a browser or Fifi confirmation popup
- Draft restoration remains silent and private
- Only the four most recent working canvases are retained for each profile
- The visible Recent work strip can reopen those canvases
- Permanent gallery saving remains an explicit button
- 27 unique coloring scene IDs and titles; every scene contains at least seven paintable regions
- Catalog subject checks cover animals, nature, tulips, landscapes, fantasy, vehicles, and space
- 18 solid paints and eight gradients
- Canvas gradients use actual gradient color stops
- Coloring interaction, accessible region buttons, and Creative Studio navigation
- Ten brush choices, adjustable stroke size, ten base paints, and 12 editable shapes
- Square and triangle placement/editing without canvas expansion or blank-screen failure
- Shape movement, resizing, rotation, duplication, recoloring, and removal
- Private gallery saving plus parent-gated Android save/share

## Preserved whole-app coverage

- 86 total tests also cover profiles, exact-age routing, resume points, progress isolation, Fifi, read-aloud, storybooks, six puzzle mechanics and deduplicated routing, 72 Math/Science concepts, adaptive Math question generation and progression, 47 Science Labs, mentor recommendations, approved external learning hosts, and 400 distinct Discovery missions in each older age world.

## Android configuration checks

- Android 16 / API 36 target and Android 7 / API 24 minimum
- App version 2.7.0 / code 14
- Offline cache namespace v2.7.0
- Cleartext HTTP disabled and Android cloud backup disabled
- No ads, analytics, child login, camera, microphone, location, contacts, or broad storage access
- Artwork stays in app storage until a grown-up deliberately exports it
- Production source maps disabled
- Release R8 minification and resource shrinking enabled

## Physical-device checks still required

Run the included Android project on a real phone and tablet. Check portrait/landscape, finger and stylus drawing, all brushes and gradients, every shape near canvas edges, the 27 coloring pages, recent-work restoration, gallery saving, Android sharing/printing, installed-app resume, read-aloud voices, and airplane mode. Finally build a signed `.aab` in Android Studio and retain its `mapping.txt`.
