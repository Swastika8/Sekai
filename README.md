# Sekai · 世界

Sekai is Swastika’s personal journal about Japanese, code, design, and everyday life. The walk begins beside a waterfall, passes a tea house and flowering cherry trees, and ends at a pond where five patterned koi react to ripples. Readers can jump straight to the journal, filter by topic, or search for an essay.

![Five koi beneath the surface of Sekai’s moon pond](frontend/src/assets/garden/koi-pond.webp)

## Run locally

Use Node.js 24. From the repository root, install the frontend dependencies and start the development server.

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the URL Vite prints. The development server includes the journal API. React and TypeScript handle the reading interface, Three.js renders the garden, and Node.js stores posts in SQLite. Readers who prefer reduced motion or have WebGL disabled get still garden views.

## Write and publish

Open **Writing studio** in the footer or visit `/studio`. On the first local visit, set an owner password. Write in Markdown, preview the article, then save a draft or publish it. A published post gets its own URL. The wooden sign beside the tea-house steps and the footer both lead to Swastika’s Medium profile. You can change that link in the studio.

A fresh database includes *Just Meet Them Once* and *Deconstructing 2,136 Jōyō Kanji Through Visual Etymology*. Subsequent edits and new posts live in the database. Back up SQLite to preserve that work across deployments.

## Test and serve

### Cloudflare Pages

Connect this repository to a Cloudflare **Pages** project and use these build settings. Pages assigns the project a `pages.dev` address on deployment. [Cloudflare’s Git setup guide](https://developers.cloudflare.com/pages/get-started/git-integration/)

| Pages setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `frontend` |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Environment variable | `NODE_VERSION=24` |

For Direct Upload, run `npm --prefix frontend run build:pages` from the repository root and upload the contents of `frontend/dist-pages`.

The public site serves the 3D garden, search, and articles as static files. To publish from the local studio, publish the article locally, open `/api/posts/<slug>` on that same local server, and save its JSON as `backend/content/<slug>.json`. Commit the file and push to `main`. You can also edit the two published files directly. Keep drafts in the local studio. Pages reads the Medium address from `backend/public-profile.json`. Set `SEKAI_MEDIUM_URL` to override it for a particular build.

### Node server with writing studio

```sh
node --test backend/api.test.mjs
npm --prefix frontend run build
node backend/server.mjs
```

The production server serves the built site and API together at `http://127.0.0.1:4173` by default. The API tests run against a disposable database and cover studio access, private drafts, publishing, and logout.

For hosting, use a Node.js service with HTTPS and a persistent disk for `SEKAI_DATA_DIR`. Set `SEKAI_PUBLIC_ORIGIN` to the public HTTPS origin and initialize the owner password before launch. To move an existing journal, use a consistent SQLite backup. The database contains private drafts and authentication records and belongs outside Git.

See the [setup, configuration, and artwork notes](frontend/README.md) for the available settings and details of the garden.
