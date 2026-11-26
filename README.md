# Sekai · 世界

[Visit the live garden and journal](https://sekaiblog.vercel.app/)

I’m Swastika, and Sekai is where I write about learning Japanese, building things with code, design, and everyday life. I wanted the site to feel like a walk through a garden. Start at the waterfall, pass the tea house and cherry blossoms, and head down to the moon pond to send a ripple past five koi. If you’re here to read, you can jump straight to the journal, filter by topic, or search for an essay.

![Five koi beneath the surface of Sekai’s moon pond](frontend/src/assets/garden/koi-pond.webp)

## Run locally

I use Node.js 24. To run Sekai locally, install the frontend dependencies and start the development server from the repository root.

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open the URL Vite prints. I use React and TypeScript for the reading interface, Three.js for the garden, and Node.js with SQLite for the local journal. The development server includes the journal API. I also included still views of the garden for readers who prefer reduced motion or have WebGL disabled.

## Write and publish

I write in Markdown in my local **Writing studio**, which I can open from the footer or at `/studio`. The first local visit prompts me to set an owner password. From there I can preview an article, keep it as a draft, or publish it with its own URL. The little wooden sign beside the pot on the lantern path and the link in the footer take you to my Medium profile. I can update that address in the studio.

A fresh database includes two of my posts, *Just Meet Them Once* and *Deconstructing 2,136 Jōyō Kanji Through Visual Etymology*. I back up SQLite to keep my drafts, edits, and new posts across deployments.

To put a post on the live site, I publish it locally, open `/api/posts/<slug>` on my local server, and save the JSON as `backend/content/<slug>.json`. Then I commit the file and push to `main`. I can also edit the published JSON directly. I keep my drafts in the local studio. The public build reads my Medium address from `backend/public-profile.json`, and I can override it with `SEKAI_MEDIUM_URL`.

## Test and serve

### Vercel

I host Sekai on Vercel. The public build serves the garden, search, and articles as static files. I use the **Other** framework preset, keep the root directory at the repository root, and use Node.js **24.x**. My `vercel.json` sets the install and build commands, output directory, and article routing. Pushes to `main` update the site through Git integration. [Import a repository on Vercel](https://vercel.com/new)

### Cloudflare Pages

I can deploy the same static build to Cloudflare **Pages** with these settings. Pages assigns the project a `pages.dev` address on deployment. [Cloudflare’s Git setup guide](https://developers.cloudflare.com/pages/get-started/git-integration/)

| Pages setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `frontend` |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Environment variable | `NODE_VERSION=24` |

For Direct Upload, I can run `npm --prefix frontend run build:pages` from the repository root and upload the contents of `frontend/dist-pages`.

### Node server with writing studio

```sh
node --test backend/api.test.mjs
npm --prefix frontend run build
node backend/server.mjs
```

I use these commands to test and run the full journal and studio together. The server defaults to `http://127.0.0.1:4173`. The API tests use a disposable database to check studio access, draft privacy, publishing, and logout.

If I host the studio, I’ll use a Node.js service with HTTPS and a persistent disk for `SEKAI_DATA_DIR`. I’ll set `SEKAI_PUBLIC_ORIGIN` to the public HTTPS origin and initialize the owner password before launch. I keep the database outside Git because it holds my private drafts and authentication records. I use a consistent SQLite backup when moving an existing journal.

I keep more details about the garden and its settings in my [setup, configuration, and artwork notes](frontend/README.md).
