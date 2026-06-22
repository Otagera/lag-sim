# Design Sync Notes — Lagos Governor Sim

## Repo shape
- Application, not a component library (no `main`/`module`/`exports` in package.json)
- Vite configured in app mode — no library build
- All `src/ui/` components read from `useGameStore()` (Zustand) and cannot render in isolation without a full game-state mock
- Synced as **tokens-only DS** — Federal Gazette design token system

## Build setup
- Entry: `.design-sync/ds-entry.ts` (empty stub — tokens-only requires an explicit --entry since the pkg isn't self-installable)
- CSS entry: `.design-sync/tokens.css` — a standalone copy of the Federal Gazette tokens WITHOUT the `@import "tailwindcss"` line (Tailwind v4 import would fail in the converter's isolated context)
- Build command: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry .design-sync/ds-entry.ts --out ./ds-bundle`
- Validate command: `node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check` (no components to render-check)

## Fonts
- Newsreader and Archivo Narrow are loaded from Google Fonts CDN in `index.html` — NOT shipped as @font-face
- `runtimeFontPrefixes: ["Newsreader", "Archivo Narrow"]` suppresses [FONT_MISSING]
- `tokens.css` includes a Google Fonts `@import url(...)` so designs actually load the fonts

## Token drift risk
- `src/index.css` is the source of truth for tokens. `.design-sync/tokens.css` is a manually maintained copy (minus the Tailwind import). If tokens change in `src/index.css`, update `tokens.css` and re-sync.
- Dark mode in the app uses `.dark` class on `<html>`. `tokens.css` mirrors this correctly.

## Re-sync command
```bash
cp -r "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/package-build.mjs" \
  "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/package-validate.mjs" \
  "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/package-capture.mjs" \
  "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/resync.mjs" .ds-sync/
cp -r "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/lib" \
  "/private/tmp/claude-504/bundled-skills/2.1.183/b96faaf502f9e9006fd4b31eda87931d/design-sync/storybook" .ds-sync/

node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry .design-sync/ds-entry.ts --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle --no-render-check
```

## Re-sync risks
- **Token drift**: `tokens.css` is a maintained copy — any token change in `src/index.css` needs a manual update here before re-sync
- **No component previews**: the render check is permanently skipped (--no-render-check); if components are ever added to the sync, playwright will need to be installed
- **Skill path hardcoded in NOTES**: the bundled-skills path changes between Claude Code sessions — update the re-sync command above if staging fails with ENOENT

## Known render warns
- `[RENDER_SKIPPED]` — expected, no components to render-check (tokens-only DS)
