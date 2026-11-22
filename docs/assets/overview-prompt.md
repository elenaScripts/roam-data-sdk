# Overview image

Created with the built-in image generation tool. This illustration uses synthetic data and represents the SDK workflow. The SDK itself is a code library with no graphical interface.

The banner is saved as `sdk-overview.png`. Its result values match `examples/demo.mjs`: approximately 1.112 km between two points over a 10-minute segment. The release scanner pins the reviewed image's checksum; a replacement needs a fresh visual review and checksum update in `scripts/check-release.mjs`.

## Generation prompt

```text
Use case: infographic-diagram
Asset type: GitHub README overview image for an open-source TypeScript library
Primary request: create a polished developer-tool illustration that explains Roam data SDK at a glance, showing supplied JSON data flowing through local library functions into a route summary
Scene/backdrop: a clean, warm off-white editorial canvas, subtle paper texture, crisp charcoal typography, restrained forest-green and terracotta accents
Subject: the offline SDK workflow, not an application screenshot
Composition/framing: wide landscape approximately 16:9, generous whitespace, large readable headline, a clear left-to-right flow of three connected stages below it; all content inside ample safe margins
Style/medium: precise contemporary graphic design with flat vector-like illustration, small code panels and minimal schematic geometry, no 3D
Text (verbatim): headline "Roam data SDK"; subtitle "Offline pet location tools for TypeScript"; left stage "Your data" and "JSON history"; middle stage "Local processing" with one accurate monospaced line "summarizeDataset(dataset)" and small labels "Validate", "Measure", "Summarize"; right stage "Route summary" with the three prominent results "1.112 km", "10 min", "2 points"; a small footer "Synthetic example"
Details: the input stage uses a neat JSON document illustration, the SDK stage is a refined code panel, and the output stage uses clearly legible metrics with a minimal two-point connecting line as a schematic route; slim directional arrows connect the stages
Constraints: exact text with sentence case, no full stops after titles or labels, readable at normal GitHub README width, retain uppercase SDK, JSON and TypeScript as written, all metrics correspond to the supplied synthetic example with two equatorial points 0.01 degrees apart over 600000 milliseconds; this is an illustration of library behavior, not a mock app UI
Avoid: company logos, external service names, account details, real locations, maps or map-provider branding, satellite imagery, live-tracking indicators, photos of pets, fake browser chrome, badges, watermarks, additional text, tiny illegible code
```

## Refinement prompt

```text
Edit the supplied Roam data SDK overview image. Preserve the composition, colors, typography, title, subtitle, central code call, arrows, right-hand metrics, footer, borders, and decorative shapes exactly.
Change only the content of the left card beneath "JSON history". Remove its entire JSON code block, including the incorrect shortened "lat" and "lon" field names. In its place, create a clean, balanced document illustration with a small pair of curly braces at the top and three large, clearly readable text rows, verbatim: "Coordinates", "Timestamps", "Segments". These are descriptive labels, not code. Use the existing charcoal and forest-green colors and the same cream panel background. Keep all of the content comfortably inside the existing left card.
Do not add any other text, values, company marks, badges, or UI chrome. Keep "summarizeDataset(dataset)", "1.112 km", "10 min", "2 points", and "Synthetic example" unchanged. The result must remain a clear illustration of an offline library workflow with sentence-case labels and no full stops after titles.
```
