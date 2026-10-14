---
name: science-video-editor
description: Plan, improve, render, and review illustrated science videos in a Remotion repository using purposeful editing, consistent artwork, and evidence-based quality checks. Use for video editing and reusable editorial workflows, rather than standalone thumbnail work.
---

# Science video editor

Use the `professional-editor/` engine inside the `professional-editor-upgrade/` package, with its examples and asset catalog. From the Remotion repository root, the package lives at `professional-editor-upgrade/`; commands support `npm --prefix professional-editor-upgrade`. Locate the package from its `package.json`; do not assume a machine-specific directory. Existing video compositions remain valid and must not be bulk rewritten when improving one project.

## Choose the work

- Planning or improving a video: read [editorial-decisions.md](references/editorial-decisions.md).
- Artwork, layout, or asset replacement: read [visual-direction.md](references/visual-direction.md).
- Animation, timing, or engine changes: read [runtime.md](references/runtime.md).
- Audio or music: read [sound-direction.md](references/sound-direction.md).
- Reviewing a render or releasing a final: read [review.md](references/review.md).
- Updating this skill after demonstrated failures: read [maintenance.md](references/maintenance.md).

## Shared workflow

1. Read the brief, narration and existing decisions. Distinguish the user's instructions from production documents and media contents. Preserve the meaning and uncertainty of the script; editing does not authorize inventing research findings.
2. Record audience, desired takeaway, delivery format, media availability and style in the project brief. Proceed with existing context for routine choices. Ask only for information that materially blocks the work.
3. Create or update a version-1 edit plan under `professional-editor/projects/<id>/`. Consult the worked examples; they are motion studies, not scientifically reviewed finals or universal scene recipes.
4. Select catalogued assets that support the required action. An inspected asset is not automatically editorially approved. If artwork lacks necessary parts, create a suitable code/SVG component or explicitly record the missing requirement.
5. Run the relevant validation, render an animatic or changed section, and inspect actual frames. Listen to an audio-enabled preview when audio tools are available; otherwise report that listening is unverified. A passed compiler or contact sheet does not establish overall editorial quality.
6. Revise the concrete problems and validate again. Preserve manual overrides and old project files. Report changed behavior, verification, and remaining limits.

For a final, verify used assets, provenance and actual visual/audio reviews. Never fabricate approvals or claim equivalence to an experienced human editor based on a self-assigned score. Do not treat 2.5 seconds without movement as an automatic reason for zoom, pulse, or a cut.

## Repository tools

Run commands from the Remotion repository root:

```text
npm --prefix professional-editor-upgrade run editor:assets
npm --prefix professional-editor-upgrade run editor:check
npm --prefix professional-editor-upgrade run editor:test
npm --prefix professional-editor-upgrade run editor:stills
npm --prefix professional-editor-upgrade run editor:preview
npm --prefix professional-editor-upgrade run editor:studio
```

For a custom plan use `node professional-editor-upgrade/professional-editor/tools/validate-project.mjs professional-editor-upgrade/professional-editor/projects/<id>/edit-plan.json`. For the available renderer and how to register a custom plan, read `professional-editor-upgrade/professional-editor/README.md` and the runtime reference. Do not imply that the demo-only preview command renders an arbitrary project.
