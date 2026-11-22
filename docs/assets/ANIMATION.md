# Animated SDK overview

The README uses `sdk-workflow.png`, an eight-second looping animated PNG of the supplied-data workflow. It is an explanatory illustration of a code library. It does not show live tracking or the SDK taking eight seconds to run.

The main animation and still poster are rendered at 2000 by 1200 pixels and displayed at up to 1000 CSS pixels wide. Full-color, lossless PNG frames preserve text edges and subtle material gradients. The 1000-by-600-pixel GIF is retained as a compatibility copy.

## Sequence

1. Show a dog galloping above a short schematic location trail
2. Gently highlight validation, measurement, and summarization in the fixed typography
3. Move a small marker along the trail toward its location pin
4. Reveal the summary values without moving the labels
5. Hold the completed result for reading before resetting gently

The synthetic result matches `examples/demo.mjs`: two points, approximately 1.112 km, and a 10-minute segment span. The renderer checks these values against the actual SDK before creating the GIF. Labels and code stay in place while attention moves through the workflow.

## Visual direction

The visual centers on a dog and its location, with the deep blue ground, warm ivory tones, asymmetrical composition, and open space retained from the earlier poster direction. An original side-profile dog illustration sits above a single schematic trail and location pin. A two-line Roam title and the synthetic walk results keep the purpose of the SDK visible.

The dog uses ten complete silhouette poses over a 1000 ms running cycle, holding each pose for 100 ms. Contact, gathering, push-off and airborne extension are represented as whole-body poses, keeping the legs, spine and tail together. The old articulated-leg model has been replaced. The [motion study from the Wellcome Collection](https://wellcomecollection.org/works/x353z8n2) was consulted as a reference for the phases of running.

The silhouettes were created with the built-in image generation tool; [the prompts](dog-run-prompt.md) and [source sheet](dog-run-sheet.png) are included. The preparation script converts the silhouettes to smoothed SVG paths and aligns their head positions. The final lettering and silhouettes are rendered at full resolution, rather than enlarging the sprite bitmap.

## Reduced motion

The README's `picture` element selects `sdk-overview.png` when the viewer requests reduced motion. A direct still-image link is also available beneath the artwork.

## Rebuild the animation

The [renderer](../../scripts/render-overview.mjs) draws the material layers, labels, and motion in SVG and encodes PNG frames and a compatibility GIF with [Sharp](https://sharp.pixelplumbing.com/api-output/). The small [APNG container writer](../../scripts/apng.mjs) follows the [PNG animation specification](https://www.w3.org/TR/png-3/#apng). It combines changed pixels over the previous opaque frame, preserving the original RGBA values without keeping every high-resolution frame in memory.

The renderer exports an [editable still SVG](sdk-overview.svg), a [PNG poster](sdk-overview.png), the [animated PNG](sdk-workflow.png), and a [compatibility GIF](sdk-workflow.gif). These are documentation tools, not SDK runtime dependencies.

From the repository root, install the optional graphics tool into the ignored output directory, build the SDK, and render:

```sh
npm install --prefix output/animation-tools --no-save --package-lock=false sharp
npm run build
ROAM_ASSET_MODULE_ROOT="$PWD/output/animation-tools" node scripts/render-overview.mjs
```

To rebuild the vector silhouettes from the source sheet before rendering:

```sh
ROAM_ASSET_MODULE_ROOT="$PWD/output/animation-tools" node scripts/prepare-dog-run.mjs
```

Use [Sharp 0.34.3 or later](https://sharp.pixelplumbing.com/changelog/v0.34.3/), which supports `raw.pageHeight` for the compatibility GIF. Both animations use nominal 50 ms frame intervals; the GIF encoder may combine identical frames into longer holds. Input and processing stages use eased fades; results enter over 200 ms with an 80 ms stagger. The completed result remains readable for more than two seconds.

To render only the poster and three review snapshots, add `--preview` to the renderer command.

Review the input, processing, and result PNG snapshots in `output/animation-review`, and play the exported animation before publishing. The renderer also records an expected RGBA hash for every full-resolution frame so an independent decoder can check the assembled APNG losslessly. Regenerated assets need a fresh visual review and checksum update in `scripts/check-release.mjs`.

The [earlier generation prompts](overview-prompt.md) record the previous illustration. The current artwork is generated entirely by the renderer.
