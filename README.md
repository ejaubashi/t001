# Editorial portfolio

A responsive recreation of the normal-mode layout and interactions studied at gilhuybrecht.com. Built with browser JavaScript, CSS and a small Node server; no package installation is needed.

Run `npm run dev`, then open port 3000. Set `PORT` to use a different port. `npm run check` checks JavaScript syntax. The server supports direct page/project URLs and video range requests.

Includes desktop Grid and Gallery, project details with numbered media navigation, browser Back and Escape, Profile, privacy, email-copy feedback, local images/videos, keyboard navigation and reduced-motion support. All core media is served locally.

Focus mode (`/focus`) replaces the experimental Star Wars mode. It presents one large project preview with previous/next controls, a thumbnail filmstrip, arrow-key navigation and touch swipes. Selecting Explore opens the full project viewer. Transitions respect reduced-motion preferences. Reference content remains for visual comparison; newsletter subscriptions have no backend.

The reference name, copy, contact address, external links, project media and typeface remain for visual comparison. Replace these in `public/data.json` and `public/assets` with your own portfolio before publishing; confirm appropriate rights for any reference assets/typeface you retain. The displayed email button copies the reference contact address.

Reference-study evidence lives outside this checkout at `/workspace/site-study/STUDY.md` in the current environment. Use the existing checkout; cloud tasks are already isolated and do not require a new worktree.

## GitHub Pages

`.github/workflows/pages.yml` deploys the static site on pushes to `main`. In repository Settings → Pages, choose **GitHub Actions** as the source. No hosting account or additional package dependencies are needed.

`BASE_PATH=/t001 npm run build` creates the static `dist/` output for the `ejaubashi/t001` project URL. The build sets the asset and navigation prefix and includes a `404.html` fallback for direct project URLs. Local development remains at `/`. GitHub Pages may return HTTP 404 for a directly loaded client-side route while correctly displaying its fallback page; in-app navigation uses History API.

## Motion

Fine-pointer wheel input uses inertial scrolling (0.15 interpolation, 1.25 wheel multiplier), including the project viewer. Touch and keyboard scrolling stay native. Profile now uses an original WebGL mesh renderer: one textured card interpolates between three layout anchors, rotates with scroll progress, changes imagery, and bends with movement. Grid/Gallery changes use subdivided WebGL media planes: all visible images move between layouts with staggered vertex motion, surface curvature and outgoing pinch effects. Gallery hover moves the selected project into its full-width top thumbnail strip and restores it on leaving. The motion module cleans up its canvas and GPU resources when leaving Profile.

Reduced-motion users get native scrolling, immediate layout changes and the static profile image. Devices without WebGL keep the static image too. The scroll card is a recreation of the studied behavior, with eight local texture variations rather than the reference's full image sequence.

Deployment builds add a content revision to JavaScript, module imports and stylesheet URLs so a new release does not reuse older cached code.

Gallery composition is regenerated when entering the view. Hovering a project fades the header and dims other work, moves the project frames into the top strip, and shows a pointer-following title; leaving returns the media to its layout.  These reproduce the studied interaction structure with original rendering code; they do not duplicate the reference shader pixel for pixel.
