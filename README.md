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

Open **Writing studio** in the footer or visit `/studio`. On the first local visit, set an owner password. Write in Markdown, preview the article, then save a draft or publish it. A published post gets its own URL. The studio also lets you set the Medium profile link shown in the footer.

A fresh database includes *Just Meet Them Once* and *Deconstructing 2,136 Jōyō Kanji Through Visual Etymology*. Subsequent edits and new posts live in the database. Back up SQLite to preserve that work across deployments.

## Test and serve

```sh
node --test backend/api.test.mjs
npm --prefix frontend run build
node backend/server.mjs
```

The production server serves the built site and API together at `http://127.0.0.1:4173` by default. The API tests run against a disposable database and cover studio access, private drafts, publishing, and logout.

For hosting, use a Node.js service with HTTPS and a persistent disk for `SEKAI_DATA_DIR`. Set `SEKAI_PUBLIC_ORIGIN` to the public HTTPS origin and initialize the owner password before launch. To move an existing journal, use a consistent SQLite backup. The database contains private drafts and authentication records and belongs outside Git.

See the [setup, configuration, and artwork notes](frontend/README.md) for the available settings and details of the garden.
