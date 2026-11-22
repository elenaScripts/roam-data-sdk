# Animated SDK overview

The README uses `sdk-workflow.png`, an eight-second looping animated PNG introducing the SDK. It is an explanatory illustration of a code library. It does not show live tracking or the SDK taking eight seconds to run.

The main animation and still poster are rendered at 2000 by 1200 pixels and displayed at up to 1000 CSS pixels wide. Full-color, lossless PNG frames preserve text and silhouette edges. The 1000-by-600-pixel GIF is retained as a compatibility copy.

## Sequence

The title, description, and code form a single block on the left. The dog runs above a short schematic location trail on the right. One row beneath them presents the example's distance, recorded duration, and location count.

Only the dog animates. The lettering, route, pin, and results remain visible in fixed positions throughout the loop, without blinking, fades, moving markers, or staged number reveals.

The synthetic result matches `examples/demo.mjs`: two points, approximately 1.112 km, and a 10-minute segment span. The renderer checks these values against the actual SDK before creating the assets.

## Visual direction

The visual centers on a dog and its location, with the deep blue ground, warm ivory tones, asymmetrical composition, and open space retained from the earlier poster direction. An original side-profile dog illustration sits above a single schematic trail and location pin. A two-line Roam title and the synthetic walk results keep the purpose of the SDK visible.

The dog uses ten complete silhouette poses over a 1000 ms running cycle, holding each pose for 100 ms. Contact, gathering, push-off and airborne extension are represented as whole-body poses, keeping the legs, spine and tail together. The old articulated-leg model has been replaced. The [motion study from the Wellcome Collection](https://wellcomecollection.org/works/x353z8n2) was consulted as a reference for the phases of running.

The silhouettes were created with the built-in image generation tool; [the prompts](dog-run-prompt.md) and [source sheet](dog-run-sheet.png) are included. The preparation script converts the silhouettes to smoothed SVG paths. It registers each pose around the center of its torso, reducing position jumps caused by changing head, paw, and tail positions. It preserves each complete pose without separately moving individual limbs. The final lettering and silhouettes are rendered at full resolution, rather than enlarging the sprite bitmap.

## Reduced motion

The README's `picture` element selects `sdk-overview.png` when the viewer requests reduced motion. A direct still-image link is also available beneath the artwork.

## Rebuild the animation

The [renderer](../../scripts/render-overview.mjs) draws the layout and dog poses in SVG and encodes PNG frames and a compatibility GIF with [Sharp](https://sharp.pixelplumbing.com/api-output/). The small [APNG container writer](../../scripts/apng.mjs) follows the [PNG animation specification](https://www.w3.org/TR/png-3/#apng). It combines changed pixels over the previous opaque frame, preserving the original RGBA values without keeping every high-resolution frame in memory.

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

Use [Sharp 0.34.3 or later](https://sharp.pixelplumbing.com/changelog/v0.34.3/), which supports `raw.pageHeight` for the compatibility GIF. Both animations use nominal 50 ms frame intervals. Each dog pose is held for 100 ms, and the cycle repeats once per second. The GIF encoder may combine identical frames into longer holds.

To render only the poster and review snapshots, add `--preview` to the renderer command.

Review the pose snapshots in `output/animation-review`, and play the exported animation before publishing. The renderer also records an expected RGBA hash for every full-resolution frame so an independent decoder can check the assembled APNG losslessly. Regenerated assets need a fresh visual review and checksum update in `scripts/check-release.mjs`.

The [earlier generation prompts](overview-prompt.md) record the previous illustration. The current artwork is generated entirely by the renderer.
