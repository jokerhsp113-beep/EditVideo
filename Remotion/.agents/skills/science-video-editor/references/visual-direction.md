# Visual direction and asset selection

For this user's BIY science videos, use the shared hand-drawn typography and annotation system: `src/design/typography.ts` and `src/design/Ink.tsx` at the Remotion repository root. Headline, label and caption use bundled Patrick Hand; bundled Noto fonts cover absent scientific glyphs. Font failures cancel rendering. Do not reintroduce Inter/Luckiest Guy/Arial as primary faces, synthetic bold, arbitrary dash patterns, heavy label shadows or automatic reaction stickers by shot index. This preference is scoped to this channel, not unrelated projects.

Read `professional-editor-upgrade/professional-editor/VISUAL-STYLE.md` from the repository root for the concrete style contract and regression commands. Use `guideReaction` only when the shot explicitly calls for the reaction. Review actual text fit and attachment points; glyph coverage is not visual approval. The channel profile's approval status remains pending until a real review is recorded.

## Select by function

An image used to introduce a kidney can be a single illustration. An image used to explain filtration needs separable structure and a visible flow path. Prefer code/SVG for diagrams, labels, arrows, scales and repeatable shapes; use raster artwork for detail or texture that benefits from it.

Before selecting an asset, inspect its appearance, resolution at the intended crop, alpha edges, palette, orientation and ability to perform the required action. Small raster flags are not automatic rejection: a small icon may have sufficient resolution at its displayed size.

The six new `public/pro-editor/*.svg` assets are repository-authored conceptual illustrations, not medically precise anatomy. They are individually addressable, and receptor illustrations can be parented to a cell. Inspect them before using them in a scientific production.

## Catalog contract

The asset ID is its path relative to `public/`, including extension. The catalog stores hash, dimensions, media type, source/license metadata, flags and editorial status. Keep hand-maintained metadata in `asset-overrides.json`; rebuild the catalog after changing media.

Never infer a license from a filename, an AI generator, a download URL or technical success. Existing unknown sources stay `provenance-unverified`. For approval, record the exact current SHA-256, reviewer and review evidence in the override. Approval is revoked on content change. Do not write a human reviewer's name unless that review actually occurred.

## Layout

- One primary focus per beat. Arrange supporting details so the viewer can follow cause and effect.
- Match scale and axes in comparisons. Preserve object positions across continuing scenes.
- Use a consistent type hierarchy; inspect text in the actual browser font at delivery resolution and at phone viewing size.
- Parent related layers; anchor callouts to normalized attachment points instead of detached screen coordinates.
- Leave room for captions. Static layout estimates do not account for every font metric or every animation frame.
- Do not bake labels into generated images when they must remain editable.

Missing suitable art is a production requirement to resolve, not a reason to substitute an unrelated decorative sticker.
