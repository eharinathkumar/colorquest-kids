# ColorQuest Kids 2.6.1 — Clear Canvas tablet update

Release date: August 8, 2026  
Web version: 2.6.1  
Android version: 2.6.1 (`versionCode` 12)

## Clear Canvas update

- The Creative Spark prompt no longer covers the drawing canvas.
- Children can open an idea only when they want one with **Show me an idea**.
- Recent Work is collapsed behind one compact button and expands on demand.
- Draw/Color navigation is compressed on phones and tablets so the canvas begins much closer to the top.

## Headline changes

- **One Creative Studio:** Draw and Color now sit in one clearly named path with a two-button mode switch, while retaining independent progress and resume positions.
- **27 distinct coloring scenes:** the former ten-scene loop is replaced by hand-built offline SVG artwork covering recognizable animals, gardens, landscapes, fantasy, transport, and space.
- **Animals that read as animals:** lion, elephant, red panda, sea turtle, penguin, fox, giraffe, rabbit, whale, owl, horse, frog, toucan, octopus, tiger, koala, butterfly, dinosaur, cat, and more have species-specific silhouettes and details.
- **26 paints:** 18 solid colors and eight gradients are shared by drawing and coloring. Younger children start with solids and can reveal “magic colors”; older children see the full palette.
- **Richer drawing tools:** ten brushes now include marker, pencil, crayon, chalk, watercolor, spray, rainbow, sparkle, pattern, and eraser.
- **More building pieces:** 12 editable shapes include circles, ovals, squares, rectangles, triangles, diamonds, stars, hearts, moons, clouds, arrows, and speech bubbles.
- **More base paint:** ten solid and gradient canvas backgrounds include meadow and rainbow mist.
- **Quiet recent-work safety:** Draw and Color silently keep only the four most recently edited canvases per child. This working history is separate from the permanent family gallery.
- **No leave-page interruption:** children can use Home, profiles, age/activity controls, arrows, page picker, Next, or Parent Corner without a confirmation popup.
- **Saving is deliberate:** both Draw and Color have a visible **Save to gallery** button. Only pictures a child chooses are added to the family gallery.
- **Coloring as storytelling:** every page includes one accurate animal/nature fact and an imagination prompt with read-aloud support.
- **Responsive and offline:** SVG artwork remains sharp on phones and tablets, needs no live image requests, and is included in the PWA and Android bundle.

The adaptive Math, Science, Labs, storybooks, puzzles, profiles, progress, Fifi guidance, and existing saved family artwork from 2.5 remain intact.

## Verification

- Automated tests cover the complete existing app plus Creative Studio catalog uniqueness, subject breadth, palette size, real gradient generation, silent navigation, and coloring interaction.
- TypeScript and the production GitHub Pages build pass.
- Android assets are synchronized from the same tested source.
- Production source maps remain disabled; Android release minification and resource shrinking remain enabled.

## Still required on your computer

Open the included `android/` folder in Android Studio, run on a physical phone and tablet, then create a signed release `.aab`. Follow `ANDROID_RELEASE.md`; the private signing key is intentionally not included.

## GitHub Pages update

Copy the release contents into the root of the existing `colorquest-kids` repository and keep only `.github/workflows/deploy-pages.yml`. Do not upload `node_modules` or the release ZIP. Commit and push to `main`; GitHub Actions will build and deploy the site.
