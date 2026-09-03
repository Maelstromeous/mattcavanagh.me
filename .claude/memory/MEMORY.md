# Memory index

- [Vercel migration](project-vercel-migration.md) — PHP stack retired 2026-09-03 for static Vue 3 + Tailwind on Vercel behind Cloudflare; locked decisions and the two still open
- [Legacy stack: do not install](legacy-stack-do-not-install.md) — never composer/npm install in `site/`; EOL toolchain being deleted, edit Twig/LESS and let the workflow build if a hotfix is unavoidable

Note: this memory lives in the repo at `.claude/memory/` (wired via `autoMemoryDirectory` in
`.claude/settings.json`) so it is shared via git across machines.
