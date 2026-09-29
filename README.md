# PG UNLEASHED 1/60 RX-78-2 · Interactive 3D assembly manual

A browser-based, step-by-step 3D assembly manual for Bandai's PG UNLEASHED RX-78-2 Gundam. It follows the official
manual panel by panel (256 steps, 750 parts): the inner frame (PHASE 01▶02), the truss frame (PHASE 03), the
external armor (PHASE 04), then the weapons, hands and LED unit (PHASE 05).

- Rotate, pan and zoom around the model; step forward and backward, or play the whole build.
- Each new part flies in and is highlighted; the card lists the part numbers, the action and the manual's CAUTION notes.
- Colors follow the kit's runners (frame grays, gold / chrome / silver plating, white / blue / red / yellow armor).
- Toggles: open the hatch gimmicks, light the LED, ghost the next parts, panel lines.

The 3D parts are procedural approximations built from the manual drawings, not scans of the real kit.

## Run locally

```bash
npm install
npm run dev
```

Optional: to show the manual page thumbnails inside the app, put the page images in `public/manual/pp/00.jpg` …
`71.jpg` (one image per printed page). They are not included in this repository; without them, each step links to
its page in [Bandai's official PDF manual](https://manual.bandai-hobby.net/pdf/1066.pdf).

## Deploy to GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to GitHub Pages.
In the repository settings, set **Pages → Source** to **GitHub Actions** once.

## Project layout

- `src/model/*.js`: one builder per region (legs, waist, torso, arms, head, options), in manual order.
- `src/kit.js`: the step / part registry; `src/assembly.js`: fly-in animation; `src/main.js`: UI.
- `tools/check.mjs`: headless structural check (`node tools/check.mjs legs,waist`).

Fan project, not affiliated with or endorsed by Bandai Namco or Sunrise. GUNDAM and PG UNLEASHED are trademarks of
their respective owners.
