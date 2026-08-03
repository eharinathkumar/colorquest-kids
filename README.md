# ColorQuest Kids

ColorQuest Kids is a free, ad-free, installable creative learning app for ages 1–12. It includes free drawing, shape building, coloring, varied reasoning puzzles, guided Math and Science trails, hands-on Science Labs, and Discovery Lab missions covering nature, geography, science, mathematics, and space.

## New in version 2.2 — the quality and guidance update

- Fifi, an original ColorQuest “Color Spark,” replaces the browser-origin drawing alert with friendly, accessible autosave and start-over guidance
- Every drawing exit—including the header, profile switcher, Parent Corner, age/activity controls, arrows, and page picker—uses the same safe Fifi flow
- Puzzle pages now use the same deduplicated deck as the on-screen counter: 50 unique puzzles for ages 1–3, 56 for ages 4–6, 104 for ages 7–9, and 81 for ages 10–12
- Regression coverage verifies that every advertised puzzle page is reachable exactly once before the deck repeats
- Read-aloud controls support lesson, lab, puzzle, drawing, coloring, and every Discovery prompt, with age-aware pace and pitch plus a parent voice picker
- Read-aloud uses voices supplied by the device or browser; voice availability, accent, offline capability, and sound quality vary by device
- On phones, the drawing canvas comes first and a sticky Brushes / Base paint / Shapes dock keeps creative tools within thumb reach
- Discovery Lab illustrations are generated locally from ColorQuest's bundled scene system—there are no live image searches or third-party image requests
- Drawing drafts restore privately for the same child, age world, activity, and page after an accidental exit
- Parent Corner uses a randomized multiplication check instead of a fixed answer
- The installable web app forces fresh fixed-name assets into each versioned offline cache and does not build an unbounded runtime cache
- Public and Android production builds omit JavaScript source maps; Android release builds enable code minification and resource shrinking

## Version 2.0 — the Mentor foundation

- A gentle on-device mentor recommends one small next Math step and one Science step without locking other content
- Eight interest signals—numbers, patterns, building, animals, Earth, space, experiments, and stories—grow only when a child chooses **I liked this**
- Named learning paths such as Number Explorer, Shape Architect, Living World Explorer, Experiment Detective, and Space Explorer
- Every Math and Science lesson now includes **Explain it another way**, a visual four-part concept story, a better wrong-answer hint, real-world meaning, and reflection
- 32 hands-on Science Labs: eight carefully written investigations for each age world
- Every lab follows ask → predict → test safely → observe → explain → wonder and has a **Child can try**, **Grown-up nearby**, or **Grown-up required** label
- Puzzle coaching now explains the thinking rule for matching, sorting, sequencing, patterns, odd-one-out, and clues
- Curated NASA, NOAA, and PhET learning resources protected by a grown-up check; core lessons remain available offline
- An age- and interest-aware Parent Corner bookshelf with four suggestions and a library-first message
- Drawing Studio brush-size presets: Tiny, Small, Big, and Giant, plus fine adjustment
- Private profile storage migrates automatically from v1.2; existing progress and artwork remain on the device

## Version 1.2 foundations

- Multiple private child profiles with nickname, age, avatar, and age-based starting world
- Separate completion history and resume position for every profile and activity
- Children can repeat, skip, or revisit content without streaks or locked lessons
- Redesigned Drawing Studio with eight brush styles, six base paints, and eight editable shapes
- Shapes can be moved, resized, rotated, copied, recolored, and removed independently from brush strokes
- On-device artwork gallery protected by Parent Corner
- Parent-controlled high-resolution PNG download, Android share sheet, printing, and deletion
- Existing v1.1 progress is carried into the first profile created after upgrading

## Learning introduced in version 1.1

- Six rotating puzzle formats: matching, sorting, sequencing, patterns, odd-one-out, and clue solving
- Different puzzle content and reasoning language for ages 1–3, 4–6, 7–9, and 10–12
- Eight guided Math concepts and eight guided Science concepts in every age world—64 lessons total
- Every lesson includes a plain-language big idea, worked example, interactive question, explanation, vocabulary, and an off-screen activity
- Age progression from counting, shapes, senses, and living things to fractions, algebra, forces, atoms, DNA, energy, and the universe

## GitHub Pages launch

This repository includes an automatic GitHub Pages deployment workflow.

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Open **Actions** and allow the first deployment to finish.
4. Visit `https://eharinathkumar.github.io/colorquest-kids/`.

On Android or desktop Chrome, use the in-app **Install ColorQuest** button when it appears. On iPhone or iPad, open the Share menu and choose **Add to Home Screen**.

## Local development

```bash
npm install
npm run dev
```

Production check (tests plus builds):

```bash
npm run check
```

Android-targeted web build and Capacitor synchronization:

```bash
npm run android:sync
```

Run synchronization only after all release changes are integrated; it replaces the web bundle under `android/app/src/main/assets/public/`.

Profiles, progress, and saved artwork stay on that device. No email address, cloud account, or full birthday is required. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
