# Sekai

Sekai is a personal blog with a scroll-driven Japanese garden, a searchable journal, and a password-protected writing studio.

## Walk through the garden

Scroll from the waterfall past the tea house and through the torii gate. The journal sits inside the same live scene, and the path continues to a koi pond below it. Drag the scene to look around. The markers and scene controls let you stir the falls, change the lighting, shake the maple, and ripple the pond. Tap a flowering cherry tree or its pink flower marker to release a shower of petals.

## Run locally

Use Node.js 24. From the project root, run:

```powershell
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the local address Vite prints. Select **Writing studio** in the footer or visit `/studio`. The first visit from localhost lets you set your studio password. A new journal starts with one article, “Deconstructing 2,136 Jōyō Kanji Through Visual Etymology.”

In the studio, choose **New post**, enter a title and topic, and write in Markdown. Use **Preview** to check the formatting. **Save draft** keeps a post private. **Publish** makes the post available in the journal and gives it a shareable address. You can edit or unpublish articles from the studio.

## Serve the production build

From the project root, run:

```powershell
npm --prefix frontend run build
node backend/server.mjs
```

The server listens at `http://127.0.0.1:4173` by default and serves both the journal and its API. Drafts, published posts, and studio credentials are persisted in a SQLite database under `backend/data`. Keep this directory when updating the site. Back up the database with SQLite’s backup command or copy the data directory while the server is stopped.

For a hosted instance, use a persistent disk and an HTTPS reverse proxy. Set `SEKAI_PUBLIC_ORIGIN` to the final HTTPS address. Initialize the studio password locally before exposing the service, or provide `SEKAI_STUDIO_PASSWORD` when creating a new database. The settings below can come from the process environment or `backend/.env`.

| Setting | Purpose |
| --- | --- |
| `HOST` | Interface to bind. Defaults to `127.0.0.1`. |
| `PORT` | HTTP port. Defaults to `4173`. |
| `SEKAI_DATA_DIR` | Alternative persistent database directory. |
| `SEKAI_PUBLIC_ORIGIN` | Public HTTPS origin for studio requests. |
| `SEKAI_STUDIO_PASSWORD` | Initial studio password. Used only when the studio has no owner. |

## Artwork

The walk uses one Three.js scene and a camera path tied to the page sections. A flowing waterfall uses curved water surfaces and moving droplets. Scrolling lifts the water into clouds and reveals a growing maple before the camera moves toward the bridge. The journal cards use a flat layout. Reduced-motion settings and browsers without WebGL use still garden artwork.

The koi have individual markings, flexible tails and paired fins. They briefly quicken their tail beats when a ripple reaches them. The pond stills come from the live scene. ImageGen created the waterfall, maple, cherry bough and article cover artwork.

<details>
<summary>ImageGen prompts</summary>

**Waterfall**

> Create an original widescreen 16:9 cinematic environment image for the hero of an independent Japanese-inspired literary journal. Deliver the landscape image only, absolutely no type, no lettering, no interface, no frame. A natural Japanese mountain garden at late blue hour with misted pine-covered mountain silhouettes and the last pale warm light in the valley. Camera near water level in a garden pool, looking into a deeply layered composition. On the far RIGHT EDGE, the nearest object is a tall slender white waterfall dropping from a rugged fern-covered cliff into the pool below, in front of everything (at x=84% to 99% of the image; cascade ends near y=82%); show clear cascading water threads and luminous spray against the rock. In the middle distance at x=62%, a low traditional Japanese timber house with beautiful curved dark tile eaves and glowing amber shoji windows, perched on a low mossy stone terrace above the pool, angled toward camera. A few muted copper-red maple branches over and beside the house around x=55% to 75%; fir, moss and ferns around the pond and spillway. The LEFT 45% is dark shadowy soft distant forest, dark desaturated pine green and blue-green fog, and quiet pool with ample negative space, so large off-white editorial copy can be overlaid in HTML. Cropped dark foreground leaves in upper corners, subdued forest greens and slate, warm amber from the house. The pool below springs into fine soft mist toward the bottom. Restrained cinematic color grading, moody high-end landscape photography with detailed tactile natural texture and genuinely plausible photographic depth, wide 28mm lens, editorial magazine quality. Make the scene rich yet legible, keep the waterfall and house separate silhouettes, no people, no torii gate, no neon, no illustration outlines.

**Maple**

> Edit target: the supplied 16:9 widescreen dusk photograph of a Japanese garden and glowing traditional house. Create the next frame of this same locked-off camera shot for a waterfall-to-tree transformation. Preserve the absolute camera position, image crop, sky, distant mountains, left 69% of the composition, house and windows, stone terrace, existing copper maple above the house, and all colors and twilight lighting. Change the extreme right foreground only: the large bright descending waterfall at x=82%–95% has transformed into an elegant foreground Japanese maple. The dark sinuous wet trunk rises directly from the very same place where the cascade touches the pool (x=84%, y=84%) with partially visible gnarled roots and fine branching. The broad canopy gracefully extends from approximately x=74% to the right edge, sparse burgundy and copper-red leaves with slight warm sunset rim light, forming a strong silhouette to the right of the house, never obscuring the lit windows. The now dry mossy rock face behind it is recessed in darkness, with mist still curling at the base. Preserve all of the background outside the old waterfall area as closely as possible. Deep, photographic shadow detail and the original cinematic realism. Keep original widescreen aspect ratio. No letters, no graphic ornaments.

**Journal covers**

> Create a VERTICAL TRIPTYCH photography contact sheet for three independent article covers for a sophisticated Japanese-inspired personal journal. The canvas has three equal-height full-width horizontal pictures stacked edge-to-edge; each photo fills exactly one third of the image height, with hard straight horizontal boundaries at 33.3% and 66.7%. No borders, no gaps, no lettering, no captions, no UI. Top photo: atmospheric dusk image of varied tiers of forested Japanese mountain ridges in cool slate blue and deep muted jade, threads of silvery mist suspended between the ridges and a little dusky light on horizon, wide landscape evoking dimensionality. Middle photo: moody horizontal documentary photograph of a traditional stone lantern on a soft green moss path in a quiet Japanese maple garden, dewy green and warm burnt copper leaves, soft mist and deep charcoal greens, beautifully restrained composition. Bottom photo: overhead editorial still life of a ceramic ink dish and dark wood calligraphy brush beside delicately textured creamy washi sheets with faint loose black ink strokes, sitting on a dark rustic wood desk, warm tan and subdued gold palette. Natural photography with texture like fine 35mm film, color-graded as part of one coherent independent literary journal. Each picture should work as an independent horizontal crop.

</details>

