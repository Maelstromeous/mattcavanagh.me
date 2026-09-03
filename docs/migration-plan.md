# Migration plan: PHP to a static Vue 3 site on Vercel

Status: **draft, awaiting approval**. Written 2026-09-03 from the review in
[`review-2026-09.md`](review-2026-09.md). Nothing in this plan has been built yet.

## Tasks

Open tasks, in the order they should run. A line is enough to recreate the task cold.

1. Approve this plan (or amend it) and the decisions in "Decisions I still need to make".
2. Scaffold the new app at the repo root: pnpm, Vite, Vue 3, TypeScript, sass, ESLint (neostandard), Vitest, `.nvmrc`, `vercel.json`, a CI workflow.
3. Link the repo to a Vercel project and confirm a preview deploy of the scaffold builds (my side).
4. Move the 17 cards, the two skills lists and the site links into typed data files under `src/data/`.
5. Build the components: header, employment banner, landing hero, skills icon rows, project tabs, project grid, project card, tech icon, tooltip directive, footer.
6. Port the LESS to SCSS: tokens, reset, typography, grid, header, cards, landing, portfolio. Reproduce the rendered site, including its accidents (body `#eee`, hidden footer).
7. Replace the jQuery behaviours: tab switching, mobile nav toggle, hover-scroll previews, tooltips, column packing.
8. Fix meta, SEO and accessibility: per-page title and `og:url`, `name="description"`, alt text, `aria-label`s, `rel="noopener"`, working `manifest.json`, trimmed favicon set.
9. Write the visual acceptance check: screenshot live and local at 1280/768/375 for `/` and `/portfolio` and diff them.
10. Apply the content decisions from the "Decisions" section once made.
11. Cut over: point DNS at Vercel (my side), then delete `site/`, `provisioning/`, the five old workflows, and the compiled/unused assets.
12. Post-cutover clean-up on my side: remove the two compose services and their Watchtower labels from the host, delete the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repo secrets, archive the Docker Hub repository, check whether the Ansible vault holds anything live before it is deleted, close the twelve open bot PRs and delete the `staging`, `dev`, `renovate/*` and `dependabot/*` branches.
13. Update the README and `CLAUDE.md` for the new stack and mark this plan done.

## Goal

Replace the PHP 7 / Twig / LESS / Grunt / Docker stack with a static site that Vercel builds from
this repo. Same two pages, same look, zero server-side code, as few dependencies as sensible. The
trigger is dependency security noise on a six-year-old stack, so "no runtime dependencies at all"
is the bar for the deployed site.

Constraints:

- **No visual redesign.** The rebuild reproduces what the live site renders today. Where the code
  and the rendered site disagree (see review), the rendered site wins unless I decide otherwise.
- Vue 3, because I know it and it looks plausible that I built it.
- SCSS, structured like `satisfactory-factories/web` and `albionroads/web/client`.
- pnpm. Tooling matches my other Vue repos so Renovate churn is the same shape everywhere.
- I set up the Vercel project and DNS. The repo only has to build to static output.

## Target architecture

### Shape: a Vite multi-page app, no router

The old site is two server-rendered pages with full page loads between them. The nearest static
equivalent is a Vite **multi-page** build: `index.html` and `portfolio.html` as separate entries,
each mounting a small Vue app. Vercel's `cleanUrls: true` serves `/portfolio` from
`portfolio.html`.

Why this over a single-page app with `vue-router`:

- Each page gets its own static `<title>`, `og:url` and `description` in real HTML. Social
  scrapers do not run JavaScript; a SPA shell would give both pages the same `og:url`.
- No routing dependency, no SPA fallback rewrite, no history-mode edge cases.
- Navigation behaves exactly as it does today.

If a third page ever appears this still scales; if the site ever needs client-side routing,
`vue-router` can be added then.

### Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Vue 3 + TypeScript, `<script setup>` | |
| Build | Vite, `@vitejs/plugin-vue`, `vue-tsc` | Vercel auto-detects the Vite preset, output `dist/` |
| Styles | `sass` (dart-sass), one `main.scss` entry, partials under `src/styles/` | Same layout as my other repos |
| Icons: general | `@fortawesome/fontawesome-free` from npm, self-hosted | Replaces the cdnjs FA 5.12.1 link. FA 6+ keeps `fas`/`fab` and old names as aliases; verify each of the 8 icons used |
| Icons: tech | `devicon` from npm, self-hosted | Replaces the dead rawgit link. Class names changed between devicon versions (e.g. AWS); verify all 20 against the installed version, fall back to inline SVG where a name is gone |
| Lint | ESLint flat config via `neostandard` + `eslint-plugin-vue` + `@vue/eslint-config-typescript` | Copy the working config from `satisfactory-factories/web` |
| Tests | Vitest + `@vue/test-utils` | Data-file invariants and component rendering, not pixels |
| Analytics | `@vercel/analytics` (if I want analytics at all) | The old Universal Analytics property is dead. Decision below |
| Node | `.nvmrc` = current LTS, `engines` pinned | |

No Bootstrap. The review counts the Bootstrap 3 surface at roughly 15 components and utilities
(grid, navbar, tabs/pills, jumbotron, two buttons, tooltip, `img-responsive`, `text-center`,
responsive show/hide). Hand-writing those in SCSS is less work than making Bootstrap 5 look like
Bootstrap 3, and it removes 200 KB of CSS/JS from every page.

No jQuery, Masonry, imagesLoaded or jquery.easing. Each behaviour has a small native
replacement (see "Behaviours").

### Repository layout after cutover

```
.
├── index.html                  landing entry (title, meta, mounts src/pages/landing.ts)
├── portfolio.html              portfolio entry
├── public/
│   ├── assets/img/...          favicons, meta.png, tech logos, aws/, portfolio/previews/
│   ├── manifest.json           fixed name and icon paths
│   └── favicon.ico             at the root so browsers find it
├── src/
│   ├── pages/                  landing.ts / portfolio.ts (createApp + mount)
│   ├── components/             SiteHeader, EmploymentBanner, SiteFooter, LandingHero,
│   │                           SkillsIcons, ProjectTabs, ProjectGrid, ProjectCard, TechIcon
│   ├── directives/tooltip.ts
│   ├── composables/            useColumns (packing), useHoverScroll
│   ├── data/                   site.ts, projects.ts, skills.ts, techIcons.ts
│   └── styles/                 main.scss + partials (see "SCSS structure")
├── assets-src/portfolio-originals/   the 40 MB source screenshots, NOT deployed (decision below)
├── test/
├── vercel.json
├── .github/workflows/ci.yml
├── package.json, pnpm-lock.yaml, .nvmrc, tsconfig*.json, vite.config.ts, eslint.config.mjs
├── CLAUDE.md, README.md, LICENSE.md, renovate.json
└── docs/
```

Public asset paths stay exactly as they are today (`/assets/img/...`) so nothing that links to
the current `og:image` or favicons breaks.

`site/` and `provisioning/` are deleted at cutover, not before. Until then the new app lives at
the repo root next to them; the two `package.json` files do not interact.

### Data files

The 17 cards, the 25 general tech icons and the 28 AWS icons are content, not markup. They become
typed arrays:

```ts
// src/data/projects.ts (shape only)
export interface Project {
  id: string            // 'ps2alerts'
  title: string
  url?: string          // absent for the 'portfolio' card
  linkText?: string     // 'PSB Archive' overrides the default of showing the host
  github?: string
  category: string      // 'Personal / Collaborative Project'
  date: string          // 'Started: October 2014 (Ongoing)'
  description: string   // may contain the same entities/markup as today
  preview: string       // 'ps2alerts.jpg'
  featured: boolean
  tabs: Array<'featured' | 'personal' | 'professional'>   // 'all' is implicit
  tech: TechIconId[]
  badges?: Badge[]      // star / trophy / certificate / info tooltips
  extraLinks?: Link[]   // the Guinness link on psb
}
```

The review's card table (`review-2026-09/frontend-audit.md`, section 3) is the source for every
row, including the tab order per tab. A Vitest test asserts every referenced preview image exists
and every tech icon id resolves.

The obfuscated email stays obfuscated: keep it as HTML entities in `site.ts`, rendered with
`v-html` in exactly the two places it is used today.

### SCSS structure

```
src/styles/
  main.scss              @use everything below, in order
  _tokens.scss           colours, type scale, spacing, the one breakpoint that is used
  _reset.scss            the small subset of Bootstrap's reset the site relies on
  _typography.scss       h1-h6 scale, 767px and 320px step-downs, .caption
  _layout.scss           .row/.col replacement grid, .text-center, responsive show/hide
  _buttons.scss          .btn, .btn-primary, .btn-default, .btn-lg (Bootstrap 3 look)
  _header.scss           fixed navbar, mobile dropdown, employment banner
  _tabs.scss             nav-tabs (md+) and nav-pills (xs/sm), centred
  _cards.scss            card, featured variant, card-image, card-footer
  _tooltip.scss          the CSS bubble the directive toggles
  pages/_landing.scss    scoped to #landing this time
  pages/_portfolio.scss  scoped to #portfolio-index
```

Rules of the port:

- Tokens come from `_variables.less` plus the locally scoped values the review lists (`@green`,
  `@red`, `@icon-multi`, `@mod`, the grey ramp). Nothing hard-coded twice.
- Reproduce the **rendered** result, then decide separately whether to fix the accidents. That
  means body background `#eee`, header bottom margin `0`, footer `display: none`, headings in the
  platform sans-serif.
- Drop the six unused breakpoint variables, the invalid nested `@media`, the dead `.container`,
  `.double-row`, `.no-padding`, `.row-splitter`, `#all-techs` rules.
- `darken()` becomes `color.adjust`, `round()` becomes `math.round`. Mixins replace the LESS
  `.content;` mixin-call trick.

### Behaviours

| Today (jQuery) | Rebuild |
| --- | --- |
| Bootstrap tooltips on 140 `title` attributes | `v-tooltip` directive: adds a positioned `<span role="tooltip">`, CSS opacity transition, `aria-describedby`. Keeps `title` as the source. Bottom placement in the header only. |
| Bootstrap tab switching | `ref<'all'\|'featured'\|'personal'>` in `ProjectTabs`, one `ProjectGrid` per pane with `v-show`. Full ARIA tab pattern. |
| Masonry packing (with the "layout twice" hack) | `useColumns(cards, count)` distributes cards round-robin into 1/2/3 column arrays by viewport width. Reading order matches today's grid. This is not height-aware packing; the visual check decides whether the difference is acceptable. If not, a 40-line shortest-column pass using `ResizeObserver` replaces it. Still no library. |
| Hover-scroll of the preview image (speed proportional to overflow) | `useHoverScroll`: on mount measure `img.height - container.height`; on hover set `transform: translateY(-overflow)` with `transition-duration` computed from the same 500 ms/100 px rule, half on leave. Skip when overflow < 40 px, as today. |
| Bootstrap navbar collapse | `ref(open)` toggling a class; the dropdown CSS is ported from `_header.less`. |
| GA pageview + click events | Dropped or replaced by `@vercel/analytics` (decision below). The old event code threw on every click anyway. |
| `data-href` card click-through, `#all-techs` toggle | Dead code, not ported. |

### Meta, SEO, accessibility

Per page: `<title>`, `<meta name="description">` (today it is `property=`, which search engines
ignore), `og:title`, `og:url`, `og:description`, `og:image`, `og:type`, `<link rel="canonical">`,
theme-color, apple-touch-icon 180, 32/16 PNG favicons, `/favicon.ico`, `/manifest.json` with a real
name and correct icon paths. Drop `X-UA-Compatible`, html5shiv and respond.js.

Every `<img>` gets `alt` (tooltip title for icons, "Screenshot of <title>" for previews). Icon-only
links get `aria-label`. Every `target="_blank"` gets `rel="noopener noreferrer"`. Heading order:
h1, then h2 for card titles styled as today's h3.

### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "git": { "deploymentEnabled": { "renovate/**": false } },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "<tightened; see below>" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "X-Powered-By", "value": "yorkshire-tea" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

The live site's CSP allows six third-party hosts because of the CDN links. With everything
self-hosted it collapses to `default-src 'self'; img-src 'self' data:; style-src 'self';
font-src 'self'; script-src 'self'` plus the Vercel Analytics host if analytics stays. Vite
extracts SFC styles to a stylesheet, so `'unsafe-inline'` should not be needed; the build check
confirms it. `X-XSS-Protection` is deprecated and dropped. HSTS is set by Vercel on production
domains; confirm with a header check after cutover rather than duplicating it.

One redirect must survive: `www.mattcavanagh.me` 301s to the apex with the path preserved. On
Vercel that is done by adding `www` as a domain and marking it as a redirect to the apex; no
`vercel.json` entry needed. The two routes keep their paths, asset paths are unchanged, and
`staging.mattcavanagh.me` no longer resolves. Anything else 404s today; Vercel's default 404 page
replaces nginx's unless I want a styled one (out of scope).

### CI and dependencies

- `.github/workflows/ci.yml`: pnpm install (frozen lockfile), `pnpm lint-check`,
  `pnpm exec vue-tsc --noEmit`, `pnpm exec vitest run`, `pnpm build`. Vercel does the deploying.
- The five existing workflows (`ansible-lint`, `build-base-image`, `deploy-production`,
  `deploy-staging`, `validate-composer`) are deleted at cutover.
- `renovate.json` gets the same config as `satisfactory-factories`: 14-day minimum release age,
  patch/minor automerge with squash, majors left for me. Preview deploys for `renovate/**`
  branches are switched off in `vercel.json`.

### Acceptance

The definition of "no visual redesign" is a diff, not an opinion:

1. Screenshot live `/` and `/portfolio` at 1280, 768 and 375 px wide (puppeteer-core, as in
   `satisfactory-factories/web/testing/browser`).
2. Screenshot the local build at the same widths.
3. Diff. Differences must be explainable by a listed decision (font, footer, packing) or fixed.
4. Manual: hover a card, switch tabs, open the mobile nav, tab through the header with a keyboard.
5. Lighthouse on the preview deploy: accessibility and best-practices should be markedly better
   than live (no dead CDN, no missing alt, no deprecated headers); performance should improve
   with 200 KB less CSS/JS.

## Decisions I still need to make

Each of these changes what gets built. Default in bold is what I would do if I had to pick now.

| # | Decision | Options | Default |
| --- | --- | --- | --- |
| D1 | Footer is hidden site-wide by an unscoped rule | Keep hidden / show it | **Keep hidden** (faithful); trivial to flip later |
| D2 | Headings name the Ubuntu font but never load it | Keep fallback / self-host Ubuntu | **Keep fallback** (what visitors see today) |
| D3 | Professional tab pane exists but is not linked | Leave unlinked / add the tab | **Add the tab**: the content exists and is clearly intended. Small visible change |
| D4 | Analytics | None / Vercel Analytics | **Vercel Analytics**: cookie-free, already used on my other sites, no CSP hosts beyond Vercel |
| D5 | Twitter link | Keep as twitter.com / relabel X / drop | My call; no default |
| D6 | 21 outbound project links, 11 plain `http://`, several years old | Check each; drop or mark dead ones | I check; the review lists them |
| D7 | Content typos carried in descriptions | Keep verbatim / fix | **Fix** spelling only, no rewording |
| D8 | "Last updated: 10/06/2020" and the PHP/AWS-era skills lists | Keep / refresh | Keep for the migration; refresh is a separate content task |
| D9 | 40 MB of unreferenced source screenshots in git | Keep in repo but out of `public/` / move to LFS / delete | **Keep out of `public/`** in `assets-src/`; no history rewrite |
| D10 | `psb` card is in the Featured tab without the featured border | Give it the border / leave | **Leave**: reproduces live |
| D11 | Column packing | Round-robin columns / height-aware pass | Decide from the screenshot diff |
| D12 | Cloudflare currently fronts the domain | Keep Cloudflare in front of Vercel / move DNS to Vercel | **Move DNS to Vercel**: one fewer layer, Vercel handles TLS, HSTS and the www redirect. If Cloudflare stays, SSL must be Full (strict) and its cache rules must not fight Vercel's |
| D13 | `provisioning/secrets.yml` (Ansible vault, 938 bytes, consumer playbooks already deleted) | Delete / move contents to the private infra repo first | I open it and decide; nobody else should |

## Phases

Each phase is one PR against `master` and ends with the CI green and a Vercel preview.

**Phase 1: scaffold.** Tasks 2 and 3. Two placeholder pages, full toolchain, `vercel.json`, CI.
Proves the build on Vercel before any content moves.

**Phase 2: content and components.** Tasks 4 and 5. Everything renders, unstyled.

**Phase 3: styles and behaviours.** Tasks 6, 7 and 9. The screenshot diff drives this phase to
done.

**Phase 4: meta and decisions.** Tasks 8 and 10.

**Phase 5: cutover.** Tasks 11, 12 and 13. This is the only phase with manual steps and they go
at the top of that PR: DNS, the host's compose services, the two Docker Hub secrets, the Docker
Hub repository, the vault file, the bot PRs and stale branches.

Rough size: phases 1 to 4 are two or three working sessions. Phase 5 is an hour plus DNS
propagation.

## Out of scope

- Any content refresh beyond D7 and D8.
- Any design change, including "while we're here" spacing or colour tweaks.
- A blog, a CMS, a contact form, or any server-side function.
- Rewriting git history to drop the screenshot originals.
