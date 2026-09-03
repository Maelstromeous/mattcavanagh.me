# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`mattcavanagh.me`: my personal portfolio site. Public repo, public site, and for many people the
first thing of mine they see. Two pages: a landing page and a portfolio grid. No user data, no
forms, no database, no backend logic. It is a static site that happens to be served by PHP.

**Status (September 2026):** the PHP/Twig/LESS/Grunt stack is legacy and is being replaced by a
static Vue 3 + SCSS build deployed to Vercel. The review and plan live in `docs/`:

- `docs/review-2026-09.md`: the fact-finding review of the current codebase.
- `docs/migration-plan.md`: the approved plan for the rebuild, with the task list.

Read those before proposing changes. Do not start the front-end migration until the plan has been
approved and a task in it has been pulled into progress.

## Current architecture (legacy, to be removed)

```
site/
  public/index.php          front controller: container -> router -> emit
  src/container.php         league/container 2 wiring, inflectors inject config + Twig
  src/router.php            two GET routes: `/` and `/portfolio`
  src/Controller/           MainController renders a Twig template per route
  src/ServiceProvider/      Config (from $_ENV), HttpMessage (zend-diactoros), Template (Twig 1)
  template/                 Twig: template.twig layout, landing.twig, portfolio/index.twig
  template/portfolio/index/cards/*.twig   one file per portfolio card (17)
  public/assets/less/       LESS source, compiled by Grunt to public/assets/css/main.css
  public/assets/js/         jQuery: tooltips, Bootstrap tabs, Masonry grid, hover-scroll previews, GA
  public/assets/img/        favicons, tech logos, aws/ logos, portfolio/previews + originals
provisioning/               Dockerfiles (nginx + php-fpm under runit), Ansible dev helpers, compose
.github/workflows/          build image -> push to Docker Hub; Watchtower on the host pulls it
```

Config comes from three env vars: `ENVIRONMENT`, `BASE_URL`, `VERSION` (git SHA, used as a
cache-buster `?v=`). Templates receive `base_url`, `asset_url`, `version`, `current_path` and an
HTML-entity-obfuscated `email` as Twig globals.

## Commands (new stack, repo root)

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install; pnpm 11, TypeScript pinned to 6 (see memory) |
| `pnpm dev` | Vite dev server, `/` and `/portfolio.html` |
| `pnpm lint-check` / `pnpm lint` | ESLint (neostandard + Vue + TS) |
| `pnpm exec vue-tsc --noEmit` | Typecheck |
| `pnpm exec vitest run` | Tests in `test/` |
| `pnpm build` | Typecheck then Vite build to `dist/` (hashed output under `dist/_app/`) |

Two HTML entries (`index.html`, `portfolio.html`), no router. Tailwind v4 via `src/styles/main.css`.
Stable-URL images live in `public/assets/img/`; content images are imported from `src/assets/img/`.

## Commands (legacy)

There is no local dev loop worth setting up for the old stack. Do not run `composer install` or
`npm install` in `site/`: the dependencies are years out of date and the toolchain is being deleted.
If a change to the live site is unavoidable before the migration lands, edit the Twig/LESS and let
the `deploy-production.yml` workflow build and ship it.

## Conventions

- **No vast departure from the current look.** The rebuild uses Tailwind CSS, so minor visual
  drift is accepted; a redesign is not. Compare against the live site, not against taste.
- Package manager for the new stack is `pnpm`. Tooling mirrors my other Vue repos
  (`satisfactory-factories/web`, `dignityofwar/albionroads/web/client`): Vite, vue-tsc, ESLint via
  neostandard, Tailwind, Vitest.
- Public repo: no infrastructure addresses, hostnames or webhook URLs anywhere in the repo, PR
  bodies included. `provisioning/secrets.yml` is an Ansible vault; never open it.
- Copy on the site is public-facing: no em dashes, no "it's not X, it's Y" phrasing.
- Memories live in `.claude/memory/` and are committed. Write them for a stranger to read.
