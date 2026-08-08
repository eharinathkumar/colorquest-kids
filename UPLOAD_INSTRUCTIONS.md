# Upload ColorQuest Kids 2.6.1 to GitHub

1. Unzip the release on your computer.
2. Open the unzipped folder and select its contents—not the outer folder and not the ZIP itself.
3. Upload those files into the root of the existing `colorquest-kids` repository, replacing older app files when GitHub asks.
4. Keep the existing `.github/workflows/deploy-pages.yml` file. Some computers hide `.github`; that is normal, and you do not need to replace it if the workflow is already in the repository.
5. Do not upload `node_modules`. It is intentionally not included.
6. Commit the upload to `main`, then open the repository's **Actions** tab and wait for the green deployment check.
7. Open `https://eharinathkumar.github.io/colorquest-kids/`. If an older cached copy appears, close the installed app/browser tab and reopen it once so the v2.6.1 offline cache can activate.

For Android, use the included `android/` folder and follow `ANDROID_RELEASE.md`. Uploading source files to GitHub updates the website; it does not automatically publish a new Google Play build.
