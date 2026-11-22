# Running dog artwork

The running dog key poses were generated with the built-in image generation tool, then prepared for the documentation animation. The reference photographs were used to study the motion; they are not embedded in the artwork.

## Generation prompt

```text
Use case: illustration-story
Asset type: a transparent animation sprite sheet for a running dog in a refined editorial pet-location app illustration
Primary request: create TEN coherent key poses of ONE anatomically believable medium-sized retriever-like dog in a FULL GALLOP, not walking or trotting
Canvas and layout: exactly 3840 by 1536 pixels, a uniform grid of FIVE columns and TWO rows, ten square cells of 768 by 768 pixels; one complete dog in each cell, no dividers, no labels, generous transparent margins; read poses left to right across the first row, then left to right across the second row
Subject and style: original elegant side-profile dog silhouette, facing RIGHT in every cell; warm ivory solid fill #f2ecdc on a genuinely transparent background; restrained mid-century editorial cut-paper style with smooth anatomical curves; lean healthy adult dog, a natural muzzle, soft hanging ears, a long tapering tail trailing backward; the SAME proportions, breed, scale, and identity throughout
Motion direction: a continuous looping gallop sequence. Pose 1: front paws reaching down toward contact and hind legs recovering. Pose 2: front support and hind feet gathering underneath. Pose 3: collected airborne phase with the legs tucked. Pose 4: hind paws reaching under the body for contact and front legs recovering forward. Pose 5: hind push-off, front legs reaching. Pose 6: body lifting into an extended airborne phase. Pose 7: full stretched gallop, front limbs reaching forward and hind limbs stretched backward, all feet off the ground. Pose 8: front limbs begin lowering and hind limbs recover. Pose 9: front paws reach toward the ground. Pose 10: front landing that connects naturally back to pose 1.
Registration: all dogs are the same size, with the torso centered on the same relative point in each cell; allow the spine and abdomen to flex naturally, not rigid mechanical rotation. The torso stays in roughly the same screen position as for an in-place animation. Never let ears, tail, feet, or nose cross cell boundaries.
Anatomy: exactly FOUR anatomically plausible legs per dog, with natural elbows, stifles, wrists, hocks and softly shaped paws; near and far limbs may overlap naturally. Feet must look like dog paws, not boots, hands, wooden sticks, or wheels. The tail joins smoothly to the rump, tapers to a soft tip, and follows the motion without a hard kink or rigid hook. No extra legs, disconnected paws, broken joints, or duplicate tails.
Constraints: a single flat ivory silhouette per pose; keep the negative-space separations between legs readable; no strokes, fur texture, gradients, shadows, ground plane, scenery, text, numbers, borders, accessories, collar or logo. Do not repeat a standing or walking pose. It must unmistakably depict RUNNING.
```

## Silhouette cleanup prompt

```text
Edit this running-dog sprite sheet. Preserve the ten poses, the same dog's proportions, each leg and paw shape, the natural tapering tails, and the five-column two-row layout.
Change the rendering only: make every dog a perfectly SOLID BLACK silhouette with fully opaque fill and clean edges, on a truly transparent background. Completely remove ALL white fringes, light glows, cast shadows, gradients, colored halos, soft blurs, outlines, and inner shading. Keep the negative-space gaps between the four legs open and readable. The silhouettes should look like precise cut-paper shapes, not soft photographs.
Keep every full dog inside its own cell with comfortable transparent margins, including the muzzle, paws, ears and tail. Do not add a ground plane, grid, text, labels, borders or accessories. Do not change the galloping poses into walking poses. Preserve existing transparency.
```
