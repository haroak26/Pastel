---
name: Replit NODE_ENV npm issue
description: Replit sets NODE_ENV=production globally, causing npm install to skip devDependencies like vite and tsx.
---

# Replit NODE_ENV=production npm install issue

## The rule
Always have `include=dev` in `.npmrc` for this project. Without it, `npm install` skips all devDependencies.

**Why:** Replit's container sets `NODE_ENV=production` as a global environment variable. Since npm 7+, this causes `npm install` to omit devDependencies unless overridden. Critical packages like `vite`, `tsx`, `@vitejs/plugin-react`, and TypeScript tooling all live in devDependencies.

**How to apply:**
- `.npmrc` should contain `include=dev` (already added)
- If packages like vite, tsx, or drizzle-kit are missing after a clean install, run `NODE_ENV=development npm install` manually
- The dev script uses full path `node node_modules/tsx/dist/cli.mjs server/index.ts` instead of relying on PATH for `tsx`
- If node_modules/.bin symlinks are missing, create them with `ln -sf ../tsx/dist/cli.mjs node_modules/.bin/tsx`
