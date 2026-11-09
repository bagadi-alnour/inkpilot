# Inkpilot demo

The guided loop: four steps beside the editor (write, fix with AI, accept, publish), and the source of the screenshots in [`docs/screenshots/`](../docs/screenshots).

```bash
cd demo
npm install
npm run dev            # http://localhost:3010
```

It uses the package from this checkout (`"@inkpilot/editor": "file:.."`), so run `npm run build` at the repo root after changing the package.

`?theme=light` and `?lang=ar` pick the variant, for example `http://localhost:3010/?theme=light&lang=ar`.

## Model

Without a key, `/api/inkpilot` uses a scripted model ([`lib/model.ts`](lib/model.ts)). It returns a canned fix for the seeded article and canned titles and descriptions, so the demo costs nothing to host and the screenshots come out the same every run. Put `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env.local` to use a real model. The route is public and rate-limited per caller ([`lib/rate-limit.ts`](lib/rate-limit.ts)).

## Screenshots

```bash
npx playwright install chromium   # once
npm run screenshots
```

[`scripts/screenshots.mjs`](scripts/screenshots.mjs) drives the loop in a headless browser and writes 2× PNGs to `docs/screenshots/`, in dark and light, plus one Arabic right-to-left shot. It uses a demo already running on port 3010, or starts one and stops it afterwards. Set `DEMO_URL` to shoot a deployed copy instead. Run it whenever the editor's UI changes and commit the images.

## How the steps drive the editor

[`app/demo.tsx`](app/demo.tsx) only uses the public API: `onReady` hands it the Tiptap editor, then each step calls a command (`fixIssue`, `acceptRewrite`, `requestPublish`). `useSEOReport` and `useAIRewrite` tell it which step you're on. Step 1 remounts the editor to reset the article.
