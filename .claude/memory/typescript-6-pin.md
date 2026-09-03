---
name: typescript-6-pin
description: TypeScript stays on ^6 in this repo; vue-tsc 3.3 and typescript-eslint 8 both refuse TS 7, and pnpm 11 needs allowBuilds for vue-demi
metadata:
  type: project
  volatility: hot
  lastVerified: 2026-09-03
---

`pnpm add -D typescript` pulled TS 7.0.2 on 2026-09-03. Two things broke at once:
vue-tsc 3.3.11 could not resolve `typescript/lib/tsc` (TS 7 changed its package exports), and
typescript-eslint 8.69 exits with "does not support TS 7.0". Pinning `typescript@6` fixed both.
Same cap that `satisfactory-factories` carries.

Also: pnpm 11 refuses to run any script until `pnpm-workspace.yaml` lists `allowBuilds` for
packages with install scripts. Here that is only `vue-demi` (pulled in by reka-ui); its
postinstall just links the Vue 3 build, so it is set to `true`.

**Why:** both failures look like broken config rather than a version problem, and Renovate will
keep proposing TS 7 until vue-tsc and typescript-eslint support it.

**How to apply:** leave TypeScript on `^6` until `pnpm exec vue-tsc --noEmit` and
`pnpm lint-check` both pass on a TS 7 branch. Do not "fix" the exports error by touching
vue-tsc. See [[project-vercel-migration]].
