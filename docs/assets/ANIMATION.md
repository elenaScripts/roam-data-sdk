# Animated SDK overview

The README uses `sdk-workflow.gif`, an eight-second looping animation of the supplied-data workflow. It is an explanatory illustration of a code library. It does not show live tracking or the SDK taking eight seconds to run.

## Sequence

1. Gently highlight the supplied coordinates, timestamps, and segments
2. Let two glass-like data beads follow a curved path into the SDK
3. Light the validation, measurement, and summarization stages, then carry the beads to the results
4. Reveal the summary values without moving the labels
5. Hold the completed result for reading before resetting gently

The synthetic result matches `examples/demo.mjs`: two points, approximately 1.112 km, and a 10-minute segment span. The renderer checks these values against the actual SDK before creating the GIF. Labels and code stay in place while attention moves through the workflow.

## Visual direction

The Aalto-inspired composition uses bent birch layers, chalk-white surfaces, sculpted organic outlines, and translucent green and amber glass. Curved architectural ribs and a slowly shifting daylight wash give it a quiet sense of space. The reference photographs guide the materials and forms; they are not included in the public artwork.

The artwork is drawn in SVG with fixed, readable typography. Glass beads follow eased curved paths, and the small glass form in the corner drifts gently through a continuous loop.

## Reduced motion

The README's `picture` element selects `sdk-overview.png` when the viewer requests reduced motion. A direct still-image link is also available beneath the artwork.

## Rebuild the animation

The [renderer](../../scripts/render-overview.mjs) draws the material layers, labels, and motion in SVG and encodes the result with [Sharp](https://sharp.pixelplumbing.com/api-output/#gif). It exports an [editable still SVG](sdk-overview.svg), a [PNG poster](sdk-overview.png), and the animated GIF. These are documentation tools, not SDK runtime dependencies.

From the repository root, install the optional graphics tool into the ignored output directory, build the SDK, and render:

```sh
npm install --prefix output/animation-tools --no-save --package-lock=false sharp
npm run build
ROAM_ASSET_MODULE_ROOT="$PWD/output/animation-tools" node scripts/render-overview.mjs
```

Use [Sharp 0.34.3 or later](https://sharp.pixelplumbing.com/changelog/v0.34.3/), which supports `raw.pageHeight` for animation frames. The renderer exports a 1000-by-600-pixel GIF with nominal 50 ms frame intervals; identical frames are combined into longer holds. Input and processing stages use eased fades; results enter over 200 ms with an 80 ms stagger. The completed result remains readable for more than two seconds.

To render only the poster and three review snapshots, add `--preview` to the renderer command.

Review the input, processing, and result PNG snapshots in `output/animation-review`, and play the exported GIF before publishing. A regenerated asset needs a fresh visual review and checksum update in `scripts/check-release.mjs`.

The [earlier generation prompts](overview-prompt.md) record the previous illustration. The current artwork is generated entirely by the renderer.
