# Editorial portfolio

A responsive recreation of the normal-mode layout and interactions studied at gilhuybrecht.com. Built with browser JavaScript, CSS and a small Node server; no package installation is needed.

Run `npm run dev`, then open port 3000. Set `PORT` to use a different port. `npm run check` checks JavaScript syntax. The server supports direct page/project URLs and video range requests.

Includes desktop Grid and Gallery, project details with numbered media navigation, browser Back and Escape, Profile, privacy, email-copy feedback, local images/videos, keyboard navigation and reduced-motion support. All core media is served locally.

The Star Wars display is an interpretation with a moving starfield, yellow type and subtle media perspective. The reference site's complete alternate-mode choreography could not be verified. Newsletter opens a local archive introduction; no subscription backend is configured, and no data is submitted.

The reference name, copy, contact address, external links, project media and typeface remain for visual comparison. Replace these in `public/data.json` and `public/assets` with your own portfolio before publishing; confirm appropriate rights for any reference assets/typeface you retain. The displayed email button copies the reference contact address.

Reference-study evidence lives outside this checkout at `/workspace/site-study/STUDY.md` in the current environment. Use the existing checkout; cloud tasks are already isolated and do not require a new worktree.

## GitHub Pages

`.github/workflows/pages.yml` deploys the static site on pushes to `main`. In repository Settings → Pages, choose **GitHub Actions** as the source. No hosting account or additional package dependencies are needed.

`BASE_PATH=/t001 npm run build` creates the static `dist/` output for the `ejaubashi/t001` project URL. The build sets the asset and navigation prefix and includes a `404.html` fallback for direct project URLs. Local development remains at `/`. GitHub Pages may return HTTP 404 for a directly loaded client-side route while correctly displaying its fallback page; in-app navigation uses History API.
