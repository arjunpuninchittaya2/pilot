This project is a Next.js frontend exported as static assets and served by a Cloudflare Worker that handles `/api/chat`.

## Local development

Install dependencies:

```bash
npm clean-install --progress=false
```

Build the static app:

```bash
npm run build
```

Run with Wrangler (serves static assets from `out/` and worker API routes):

```bash
npx wrangler dev
```

## Deploy to Cloudflare Workers

```bash
npm run build
npx wrangler deploy
```

`wrangler.toml` is configured for Workers (not Pages):
- `main = "worker.ts"` for API routing
- `[assets] directory = "./out"` for static frontend assets

## Validation

```bash
npm run lint
npm run build
```
