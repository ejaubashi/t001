# Design experiments and rollback

## Baseline before option B

The user asked to preserve the exact site before trying the elastic-gallery direction.

- Snapshot commit: `c00b7f934dd15bc8fc2a4ff939e2f6e99c81f726`
- Annotated tag, pushed to origin: `focus-before-elastic-b-2026-10-26`
- Baseline: Focus mode, existing Grid/Gallery, local assets and working GitHub Pages workflow.

If the user asks to return to this point, preserve any later work first. Restore the tracked tree from this tag into a new commit and publish through the existing Pages workflow. Do not force-push or erase intervening history. Verify the deployment and Focus URL afterward. The tag preserves the exact code, styles, data and media, independently of chat memory.

## Option B: elastic gallery

- Trial routes: `/elastic/` and `/gallery/`.
- Existing Focus remains at `/focus/` for direct comparison.
- Three masonry columns on desktop, two on tablet, one on mobile.
- Columns respond to scroll velocity with individually damped offsets, bounded to 65px, returning to rest.
- Low-amplitude cover hover movement, image-based ambient colour, direct project opening.
- Native touch behavior and static reduced-motion fallback.

## Living Focus composition — 27 October 2026

- User approved trying the living composition + visitor imprint inside Focus.
- Exact pre-change published commit: `e055f62051aaf8793fe26221561ec60bd7b445ac`.
- Annotated checkpoint pushed to origin: `focus-before-living-composition-2026-10-27`.
- Trial route: `/focus/`. Elastic Gallery remains unchanged.
- Nine visible project fragments, pointer repulsion and damped rearrangement, 850ms hover selection, click/tap selection and centre artwork opening.
- Arrow keys and numbered index expose all 19 projects. Each newly encountered project adds contour geometry; SVG export and reset are available.
- Canvas is decorative; real buttons/images remain authoritative. Reduced motion disables spring movement. Rendering stops at rest and listeners/observers are disposed on route changes.
- Restore checkpoint through a new commit if requested; preserve subsequent work and do not force-push.

## Layered filament sculpture — 27 October 2026

- User chose Anders Hoff as the first artistic reference, with the option to try Memo Akten or Casey Reas later.
- Exact pre-trial commit: `602fc93324e05d43ba179b5d25cbbe94957b5fdc`.
- Pushed rollback tag: `focus-before-hoff-2026-10-27`.
- Focus now contains an original procedural folded line sculpture: 240 swept cross-sections on desktop, 150 on narrow screens. This is inspired by layered generative drawing; it does not reproduce Hoff's artwork or implement his differential-growth algorithm.
- Project selection smoothly changes the shape; pointer proximity deforms it locally. Cards are smaller to expose the drawing. Rendering stops when the scene settles; reduced motion uses static geometry.
- Canvas and SVG export share the same geometry. Reset restores the encounter count and base shape for the current project.
- Gallery unchanged. Restore through a new commit if requested, without erasing later history.

## Open sculpture composition — 27 October 2026

- User selected fewer thumbnails, larger sculpture and more empty space.
- Checkpoint tag: `focus-before-open-composition-2026-10-27`, pointing to `561265f872aff529c5b183742d7075609cbfb1f0`.
- Three visible fragments (selected, next, previous), arranged at the edges to expose the sculpture's centre. All 19 projects remain available through keyboard arrows and the numbered index.
- Larger stage and more surrounding space on desktop and mobile; existing sculpture interaction and export preserved.

## Cursor discovery — 27 October 2026

- User requested hidden artworks revealed by cursor movement, with access to every work.
- Checkpoint tag: `focus-before-cursor-discovery-2026-10-27` (commit `27d041f9ba732ce2196c444d9754668d2d476f2e`).
- All 19 works occupy fixed positions across the sculpture field. Proximity reveals nearby images with a short fading trail; hover selects and a single click opens a project.
- Quiet initial state: artworks hidden until discovery. Numbered navigation above the field and arrow keys can explicitly reveal every project. Encountered numbers gain a dot.
- Touch users tap the field to uncover nearby projects, then tap an image to open. Reduced motion uses immediate opacity changes and static sculpture geometry.
- Prior sculpture, imprint export, project Back and Gallery remain available. Previous state can be restored through a new commit.
