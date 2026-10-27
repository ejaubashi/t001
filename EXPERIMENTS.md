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
