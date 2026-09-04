# Pizza Master G — Deployment-Ready Website

**Deploy this entirely through the Cloudflare dashboard — no terminal,
no Wrangler CLI, no command line, at any point.**

## The one thing to understand first

This site is built with React, which means it needs a one-time
"build" step (bundling all the code into plain HTML/CSS/JS) before
it can run in a browser. That build step has to happen *somewhere*.

You have two options for where:
- **On your own computer, in a terminal** — you said no to this.
- **On Cloudflare's own servers, automatically** — this is what
  "Connect to Git" does. You never touch a terminal; Cloudflare's
  servers run `npm install` and `npm run build` for you every time
  you push a change.

So the path below uses "Connect to Git." There's no folder you need
to manually build or upload — Cloudflare creates it for you.

**Answering your question directly: there is no build folder for you
to upload.** You just tell Cloudflare, once, in a form field, that
the output folder is named `dist` — Cloudflare builds it and hosts it
automatically, every time.

## Step 1 — Get this project onto GitHub (no terminal needed)

1. Go to [github.com](https://github.com) and create a free account if you don't have one
2. Click **+** (top right) → **New repository** → name it e.g. `pizza-master-g` → **Create repository**
3. On the new repo page, click **"uploading an existing file"**
4. Unzip this project on your computer, then **drag the entire contents** of the unzipped folder (not the zip itself — the files inside it: `src`, `functions`, `package.json`, etc.) into the GitHub upload box
5. Scroll down, click **Commit changes**

That's it — no `git`, no terminal.

## Step 2 — Connect Cloudflare Pages to that repo (dashboard only)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Authorize Cloudflare to access your GitHub, select the `pizza-master-g` repo
3. On the build settings screen, fill in:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**

Cloudflare now installs everything and builds the site on its own
servers. In a minute or two your site is live at a `*.pages.dev`
address. Every time you upload new files to the GitHub repo (step 1,
repeated), Cloudflare automatically rebuilds and redeploys — still
zero terminal.

## Step 3 — Connect the real database (do this once)

Without this step the site works, but shows a "Database not
connected" banner and admin changes won't be saved permanently or
shown to other visitors.

1. Cloudflare dashboard → **Workers & Pages** → **KV** → **Create a namespace** (name it anything, e.g. `pizza-master-g-db`)
2. Go to your Pages project → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**
   - **Variable name:** `PMG_KV` (must match exactly)
   - **KV namespace:** the one you just created
3. Go to **Deployments** → click **Retry deployment** on the latest one, so it picks up the new binding
4. Reload your site — the banner should be gone, and every admin
   change (products, prices, deals, settings) is now permanent and
   visible to every visitor

This part (Functions + KV) works automatically with "Connect to Git"
deploys — no Wrangler CLI needed for this either.

## Step 4 — Connect your domain

Pages project → **Custom domains** → **Set up a custom domain**,
then follow Cloudflare's prompts (simplest if your domain's DNS is
already on Cloudflare).

## What's inside this project
- `src/App.jsx` — the entire app (customer site + admin dashboard)
- `src/storage.js` — talks to your database via `/api/storage/...`
- `functions/api/storage/[key].js` — the Cloudflare Pages Function
  that reads/writes your KV namespace (this is your database)
- `package.json`, `vite.config.js`, `index.html` — standard files
  Cloudflare's build server needs to know how to build the project

No file in this project references Claude, `window.storage`, or any
Claude-specific environment — verified before packaging.

## Honest limitations to know about
- **Product/deal images** still use emoji swatches (same as before —
  functionality was kept exactly as-is per your request). Real photo
  uploads would need Cloudflare Images or an R2 bucket — a follow-up
  task, not included here.
- **WhatsApp order handoff** uses a `wa.me` link (customer taps
  "Send") — works with zero setup. Fully automatic, no-tap
  notifications require the paid WhatsApp Business API — a separate
  integration.
- **Admin dashboard has no password** yet. Before handing this to a
  paying client, add a login (Cloudflare Access, in the dashboard
  under Zero Trust, is the easiest zero-code option) so strangers
  can't reach it.
