# Animated SDK overview

The README uses `sdk-workflow.gif`, an eight-second looping animation of the supplied-data workflow. It is an explanatory illustration of a code library. It does not show live tracking or the SDK taking eight seconds to run.

## Sequence

1. Highlight the supplied coordinates, timestamps, and segments
2. Move a data marker into the SDK and highlight validation, measurement, and summarization
3. Move a marker to the output and reveal the summary values
4. Hold the completed result for reading before resetting gently

The synthetic result matches `examples/demo.mjs`: two points, approximately 1.112 km, and a 10-minute segment span. The renderer checks these values against the actual SDK before creating the GIF. Labels and code stay in place while attention moves through the workflow.

## Reduced motion

The README's `picture` element selects `sdk-overview.png` when the viewer requests reduced motion. A direct still-image link is also available beneath the artwork.

## Rebuild the animation

The [renderer](../../scripts/render-overview.mjs) adds timed SVG overlays to the [original illustration](sdk-overview.png) and encodes the result with [Sharp](https://sharp.pixelplumbing.com/api-output/#gif). These are documentation tools, not SDK runtime dependencies.

From the repository root, install the optional graphics tool into the ignored output directory, build the SDK, and render:

```sh
npm install --prefix output/animation-tools --no-save --package-lock=false sharp
npm run build
ROAM_ASSET_MODULE_ROOT="$PWD/output/animation-tools" node scripts/render-overview.mjs
```

Use [Sharp 0.34.3 or later](https://sharp.pixelplumbing.com/changelog/v0.34.3/), which supports `raw.pageHeight` for animation frames. The renderer exports a 1000-by-563-pixel GIF with nominal 50 ms frame intervals; identical frames are combined into longer holds. Input and processing stages use eased focus changes; results enter over 200 ms with an 80 ms stagger. The completed result remains readable for more than two seconds.

Review the input, processing, and result PNG snapshots in `output/animation-review`, and play the exported GIF before publishing. A regenerated asset needs a fresh visual review and checksum update in `scripts/check-release.mjs`.

The [original generation prompts](overview-prompt.md) document the static illustration used as the background.
