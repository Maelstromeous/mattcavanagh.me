# Migration plan: PHP to a static Vue 3 site on Vercel

Status: **approved 2026-09-03**. Written from the review in [`review-2026-09.md`](review-2026-09.md),
revised after my review and a Codex adversarial review the same day (verdict RETHINK; one major
finding on image caching, the rest wording and sequencing, all folded in below). Build starts with
Phase 1.

## Tasks

Open tasks, in the order they should run. A line is enough to recreate the task cold.

1. ~~Approve this revised plan.~~ Done 2026-09-03.
2. Confirm the analytics choice (D4). Cloudflare Web Analytics is the default until then.
3. Create the `vue-rebuild` branch and scaffold the new app at the repo root: pnpm, Vite, Vue 3, TypeScript, Tailwind CSS v4, ESLint (neostandard), Vitest, `.nvmrc`, `vercel.json`, a CI workflow. Placeholder pages only.
4. Link the repo to a Vercel project and point a preview deployment at the `vue-rebuild` branch (my side). Claude inspects the preview, or a local browser, from then on.
5. Move the 17 cards, the two skills lists and the site links into typed data files under `src/data/` (see "Data files").
6. Build the components: header, employment banner, landing hero, skills icon rows, project tabs (four tabs), project grid, project card, tech icon, tooltip, footer.
7. Style with Tailwind: theme tokens from the LESS variables, then each component. Match the live site closely; minor drift from Tailwind defaults is accepted, a redesign is not.
8. Replace the jQuery behaviours: tab switching, mobile nav toggle, hover-scroll previews, tooltips. Grid layout is CSS grid, no packing script.
9. Fix meta, SEO and accessibility: per-page title and `og:url`, `name="description"`, alt text, `aria-label`s, `rel="noopener"`, working `manifest.json`, trimmed favicon set.
10. Apply the content decisions: show footer on portfolio only, link the Professional tab, fix spelling, drop Twitter for LinkedIn, remove the six dead project links, update the four redirected links, upgrade the six plain-http links and the Guinness link to https, give `psb` the featured border.
11. Baseline live first (Lighthouse, response headers, page weight), then write the acceptance check: screenshot live and preview at 1280/768/375 for `/` and `/portfolio` and compare side by side.
12. Cut over, in this order: (a) merge `vue-rebuild` to `master` with `site/` and `provisioning/` still present; (b) I set `master` as the Vercel production branch, attach the apex and `www` domains and confirm they verify; (c) I switch the Cloudflare origin to Vercel; (d) run the post-cutover curl checklist below; (e) leave the old containers running for a week as the rollback (repoint Cloudflare); (f) then delete `site/`, `provisioning/` (vault included), the five old workflows and the compiled/unused assets in a follow-up PR.
13. Post-cutover clean-up on my side, after the week: remove the two compose services from the host, delete the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repo secrets, archive the Docker Hub repository, close the twelve open bot PRs, delete the `staging`, `dev`, `renovate/*` and `dependabot/*` branches.
14. Update the README and `CLAUDE.md` for the new stack and mark this plan done.

## Goal

Replace the PHP 7 / Twig / LESS / Grunt / Docker stack with a static site that Vercel builds from
this repo. Same two pages, same shape, zero server-side code, as few dependencies as sensible. The
trigger is dependency security noise on a six-year-old stack, so "no server-side runtime at all"
is the bar for the deployed site. Browser-side code (Vue, the icon packs) is unavoidable and is
kept small.

Constraints:

- **No vast departure from the current look.** Tailwind's defaults will shift spacing, shadows
  and type slightly; that is accepted. Layout, colours, structure and content stay recognisably
  the same site. Where the LESS and the rendered site disagree, the decision table below says
  which wins.
- Vue 3, because I know it and it looks plausible that I built it.
- Tailwind CSS, because it is what I use for CSS now.
- pnpm. Tooling matches my other Vue repos so Renovate churn is the same shape everywhere.
- Everything is built on a branch with a Vercel preview. Nothing touches `master` until cutover.
- I set up the Vercel project. Cloudflare stays in front of the domain and I point it at Vercel.

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
| Styles | Tailwind CSS v4 via `@tailwindcss/vite`; one `src/styles/main.css` with `@import "tailwindcss"` and an `@theme` block for the site's tokens | v4 is CSS-first: no `tailwind.config.js`, no PostCSS config. v4 is not designed to sit behind Sass, so there is no SCSS in this stack; the handful of custom rules (hover-scroll, tooltip bubble) are plain CSS in the same file |
| UI primitives | `reka-ui` for Tabs and Tooltip | Headless, accessible, Vue-native, already in `albionroads`. Gives correct ARIA and keyboard handling for free; Tailwind styles it. Kept after review: heavier than strictly needed, and worth it for the accessibility |
| Icons: general | `@fortawesome/fontawesome-free` from npm, self-hosted | Replaces the cdnjs FA 5.12.1 link. FA 6+ keeps `fas`/`fab` and old names as aliases; verify each of the 8 icons used |
| Icons: tech | `devicon` from npm, self-hosted | Replaces the dead rawgit link. Class names changed between devicon versions (e.g. AWS); verify all 20 against the installed version, fall back to inline SVG where a name is gone |
| Lint | ESLint flat config via `neostandard` + `eslint-plugin-vue` + `@vue/eslint-config-typescript` | Copy the working config from `satisfactory-factories/web` |
| Tests | Vitest + `@vue/test-utils` | Data-file invariants and component rendering, not pixels |
| Analytics | Cloudflare Web Analytics (D4) | Injected by the Cloudflare proxy; zero code, zero CSP change. GA4 instead if I supply a measurement ID |
| Node | `.nvmrc` = current LTS, `engines` pinned | |

No Bootstrap. No jQuery, Masonry, imagesLoaded or jquery.easing. Each behaviour has a small
native replacement (see "Behaviours").

### Repository layout after cutover

```
.
├── index.html                  landing entry (title, meta, mounts src/pages/landing.ts)
├── portfolio.html              portfolio entry
├── public/
│   ├── assets/img/...          favicons, meta.png, manifest icons: files whose URL must stay stable
│   ├── manifest.json           fixed name and icon paths
│   └── favicon.ico             at the root so browsers find it
├── src/
│   ├── assets/img/             previews/, aws/, tech logos: imported by the data files, so Vite hashes them
│   ├── pages/                  landing.ts / portfolio.ts (createApp + mount)
│   ├── components/             SiteHeader, EmploymentBanner, SiteFooter, LandingHero,
│   │                           SkillsIcons, ProjectTabs, ProjectGrid, ProjectCard, TechIcon
│   ├── composables/            useHoverScroll
│   ├── data/                   site.ts, projects.ts, skills.ts, techIcons.ts
│   └── styles/main.css         @import "tailwindcss" + @theme + the few custom rules
├── assets-src/portfolio-originals/   the 40 MB source screenshots, NOT deployed
├── test/
├── vercel.json
├── .github/workflows/ci.yml
├── package.json, pnpm-lock.yaml, .nvmrc, tsconfig*.json, vite.config.ts, eslint.config.mjs
├── CLAUDE.md, README.md, LICENSE.md, renovate.json
└── docs/
```

Two kinds of image, handled differently:

- **Stable-URL files** (favicons, touch icons, `meta.png`, manifest icons) stay in `public/assets/img/`
  at today's paths, so nothing that links to the current `og:image` or favicons breaks. Vite copies
  `public/` verbatim with no hashing, so these get a short cache (one day), not `immutable`.
- **Content images** (card previews, AWS and tech logos) live in `src/assets/img/` and are imported
  from the data files. Vite hashes their filenames, so they can be cached for a year and a changed
  preview shows up on the next deploy. Hashed output goes to `/_app/` (`build.assetsDir`), which
  keeps it apart from the unhashed `/assets/` tree.

`site/` and `provisioning/` are deleted at cutover, not before. Until then the new app lives at
the repo root next to them; the two `package.json` files do not interact.

### Data files

Today every portfolio card is a 25-line Twig file with the same structure and different words, and
the two skills rows are 53 hand-written `<i>` and `<img>` tags. "Typed data files" means: the
words move into TypeScript arrays with a declared shape, and one component renders them.

Concretely, `src/data/projects.ts` exports `Project[]`, `src/data/skills.ts` exports two
`Skill[]` lists (general tech, AWS), `src/data/techIcons.ts` maps a short id like `'php'` to how
it is drawn (a devicon class or an image path) and its tooltip, and `src/data/site.ts` holds the
header/landing links, the CV URL, the employment banner text and the obfuscated email.

```ts
// src/data/projects.ts (shape only)
export interface Project {
  id: string            // 'ps2alerts'
  preview: string       // imported image URL; the file is renamed to match the id when the data file is written
  title: string
  url?: string          // absent when the site is dead or never existed
  linkText?: string     // 'PSB Archive' overrides the default of showing the host
  github?: string
  category: string      // 'Personal / Collaborative Project'
  date: string          // 'Started: October 2014 (Ongoing)'
  description: string   // HTML allowed, as today
  featured: boolean
  tabs: Array<'featured' | 'personal' | 'professional'>   // 'all' is implicit
  tech: TechIconId[]    // ids resolved through techIcons.ts
  badges?: Badge[]      // the star / trophy / certificate / info tooltips
  extraLinks?: Link[]   // the Guinness link on psb
}
```

What that buys:

- **Adding or editing a project is a data edit**, not a template copy-paste. The typo class of
  bugs the review found (a card in the Featured tab without the featured border, a card whose
  image name is spelt differently from its id, two cards missing the cache-buster) cannot happen:
  `featured` is one boolean, the preview is an import that fails the build if the file is missing,
  and Vite hashes imported images. The two mismatched files today (`maynellsfencing.jpg`,
  `timeforteav2.jpg`) are renamed to their card ids when the data file is written; the old v1
  `timefortea.jpg` is deleted.
- **The compiler checks it.** A misspelt tech icon id or a missing field is a type error at build
  time, not a broken icon in production.
- **Tests can assert invariants** over the data: every `id` has a preview image on disk, every
  `tech` id resolves, every `url` is `https`, tab membership is consistent.
- **Order is explicit.** The All tab is array order; the other tabs are filters over the same
  array, so a card can never appear in a filtered tab and not in All.

The review's card table (`review-2026-09/frontend-audit.md`, section 3) is the source for every
row, including the tab order per tab.

The obfuscated email stays obfuscated: keep it as HTML entities in `site.ts`, rendered with
`v-html` in exactly the two places it is used today.

### Styling with Tailwind

- `@theme` carries the site's tokens, translated from `_variables.less` and the locally scoped
  values the review lists: text `#5a5a5a`, background `#eee` (the rendered value, not the LESS
  one), border `#e2e2e2`, link `#337ab7`, banner red `#fb8e8e` and green `#69bd3e`, the grey
  ramp for shadows, base font 16px on a 24px rhythm, the one breakpoint in real use (767px). The
  Tailwind `sm/md/lg` defaults replace the six unused LESS breakpoints.
- Components are Vue SFCs styled with utilities. Repeated patterns (card, button, tab) live in
  the component, not in `@apply` classes, so there is one place to change them.
- Custom CSS is limited to what utilities cannot express: the hover-scroll transition on card
  images and the tooltip bubble. Both go in `main.css`.
- Heading font: Tailwind's default sans stack. The site names Ubuntu but never loads it, so
  visitors already see a system font (D2).
- Layout is CSS grid: three columns from `md`, two from `sm`, one below, `items-start`. Cards of
  different heights align by row rather than packing (D11). The site predates flexbox; this is
  the change it should have had.

### Behaviours

| Today (jQuery) | Rebuild |
| --- | --- |
| Bootstrap tooltips on 140 `title` attributes | `reka-ui` Tooltip around each icon, styled with Tailwind, bottom placement in the header only. The tooltip text comes from the data file; no `title` attribute, so there is no second native tooltip. Icons carry `aria-label` for screen readers. |
| Bootstrap tab switching | `reka-ui` Tabs in `ProjectTabs`, four triggers (All, Featured, Personal, Professional). **One** `ProjectGrid`, fed the active tab's filtered list. Cards and images render once; hidden tabs render nothing. |
| Masonry packing (with the "layout twice" hack) | CSS grid, no script (D11). |
| Hover-scroll of the preview image | `useHoverScroll`: on mount measure `img.height - container.height`; on hover set `transform: translateY(-overflow)` with `transition-duration` from the same 500 ms per 100 px rule, half on leave. Skip when overflow < 40 px, as today. |
| Bootstrap navbar collapse | `ref(open)` toggling Tailwind classes. |
| GA pageview + click events | Removed. Cloudflare Web Analytics needs no code (D4). |
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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; frame-ancestors 'self'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "X-Powered-By", "value": "yorkshire-tea" }
      ]
    },
    {
      "source": "/_app/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }]
    }
  ]
}
```

The live site's CSP allows six third-party hosts because of the CDN links. With everything
self-hosted it collapses to `'self'`. Vite extracts SFC styles to a stylesheet, so
`'unsafe-inline'` should not be needed; the build check confirms it. If Cloudflare injects its
analytics beacon, `script-src` and `connect-src` gain `https://static.cloudflareinsights.com` and
`https://cloudflareinsights.com`. `X-XSS-Protection` is deprecated and dropped. HSTS stays with
Cloudflare, which already sets it (D12).

Routing: `/` and `/portfolio` keep their paths and asset paths are unchanged. The `www` to apex
301 lives at Cloudflare today and stays there. `staging.mattcavanagh.me` no longer resolves.
Anything else gets Vercel's default 404.

### CI and dependencies

- `.github/workflows/ci.yml`: pnpm install (frozen lockfile), `pnpm lint-check`,
  `pnpm exec vue-tsc --noEmit`, `pnpm exec vitest run`, `pnpm build`. Vercel does the deploying.
- The five existing workflows (`ansible-lint`, `build-base-image`, `deploy-production`,
  `deploy-staging`, `validate-composer`) are deleted at cutover.
- `renovate.json` gets the same config as `satisfactory-factories`: 14-day minimum release age,
  patch/minor automerge with squash, majors left for me. Preview deploys for `renovate/**`
  branches are switched off in `vercel.json`.

### Acceptance

Before building anything, **baseline live**: Lighthouse scores for both pages, total transferred
bytes, and the full response header set through Cloudflare. Numbers in this section are compared
against that baseline, not against guesses.

1. Screenshot live `/` and `/portfolio` at 1280, 768 and 375 px wide (puppeteer-core, as in
   `satisfactory-factories/web/testing/browser`).
2. Screenshot the Vercel preview at the same widths.
3. Compare side by side. Differences must be Tailwind's expected drift or a listed decision.
   Anything structural (missing element, wrong order, wrong colour family) is a bug.
4. Manual: hover a card, switch all four tabs, open the mobile nav, tab through the header with a
   keyboard, check tooltips announce.
5. Lighthouse on the preview: accessibility and best-practices better than the baseline;
   transferred bytes lower than the baseline.
6. **Post-cutover curl checklist**, run against the real domain through Cloudflare:
   `/` 200; `/portfolio` 200 direct (not via `/`); `/portfolio/` and `/portfolio.html` behave as
   `cleanUrls` intends; `/nonexistent` 404; `www` 301s to apex with path kept; `/manifest.json`
   200 and its icon paths 200; `/assets/img/meta.png` 200; every header in `vercel.json` present
   plus Cloudflare's HSTS; CSP has no violations in the browser console, including the analytics
   beacon if injected.
7. Rollback is "repoint Cloudflare at the old host", which stays up for a week after cutover.

## Decisions

Made on 2026-09-03 unless marked open.

| # | Decision | Outcome |
| --- | --- | --- |
| D1 | Footer hidden site-wide by an unscoped rule | **Show it on the portfolio page. Keep it hidden on the landing page**, where the full-height hero was the reason it was hidden. |
| D2 | Headings name Ubuntu but never load it | **System sans stack.** Not fussy as long as it reads about the same. |
| D3 | Professional tab pane exists but is not linked | **Link it.** Four tabs. |
| D4 | Analytics | **Cloudflare Web Analytics by default**, injected by the proxy, no code. Bot filtering is weak in every free option; if I decide GA4 is worth it I hand over a measurement ID and it is one script tag plus two CSP hosts. **Open** until I confirm. |
| D5 | Twitter link | **Drop it. Replace with LinkedIn** (`https://www.linkedin.com/in/mattcavanagh`) in the header and the landing hero. |
| D6 | 21 outbound links | Checked 2026-09-03; results below. **Dead links are removed and the card stays.** Redirected links are updated to their final `https` URL. |
| D7 | Spelling errors in card copy | **Fix spelling only**, no rewording. |
| D8 | "Last updated: 10/06/2020" and the 2020-era skills lists | **Leave alone for now.** Content refresh is a separate task. |
| D9 | 40 MB of unreferenced originals; were projects dropped for legal reasons? | Report below. **Nothing is missing from the repo.** Originals move to `assets-src/`, out of the deploy. No history rewrite. |
| D10 | `psb` is in Featured without the featured border | **Give it the border.** Its archive link is dead (D6), so the link goes and the card stays. |
| D11 | Column packing | **CSS grid, no packing script.** Minor row alignment change accepted. |
| D12 | Cloudflare currently fronts the domain | **Cloudflare stays.** I point it at the Vercel deployment myself; DNS does not move. Vercel gets the origin headers, Cloudflare keeps HSTS, TLS and the `www` redirect. SSL mode Full (strict). |
| D13 | `provisioning/secrets.yml` vault and the two Docker Hub secrets | **All dead, on my own knowledge** (the audit could only say "almost certainly orphaned" from the repo). Vault deleted with `provisioning/` after cutover; I delete the two repo secrets myself afterwards. |

### D6: link check results

Checked with a browser user agent, following redirects, 15 s timeout.

| Card / place | Link today | Result | Action |
| --- | --- | --- | --- |
| CV (header, landing) | Google Doc | 200 | Keep |
| GitHub (header, landing) | github.com/Maelstromeous | 200 | Keep |
| ps2alerts GitHub | github.com/PS2Alerts | 200 | Keep |
| timefortea | timeforteavintage.co.uk | 200 | Keep |
| ps2alerts | www.ps2alerts.com | 200, redirects to apex | Update to `https://ps2alerts.com` |
| dig | http dignityofwar.com | 200, redirects to https apex | Update to `https://dignityofwar.com` |
| mariokart | mariokart.fun | **503** | Remove link |
| psb | psb.mattcavanagh.me | **no DNS** | Remove link ("PSB Archive" text goes too) |
| psb Guinness | guinnessworldrecords.com article | 200 | Keep, upgrade to https |
| nsc | nanitesystemscomic.com | **no response** | Remove link |
| makinsonmotors | http makinsonmotors.com | 200, https | Upgrade to https |
| scriptmedia | http www.scriptmedia.co.uk | 200, redirects to http apex, no https | Update to `http://scriptmedia.co.uk`. The "every url is https" test allows this one exception explicitly |
| battlestarlaser | battlestarlaser.com | **503** | Remove link |
| idaq | http idaqnetworks.com | 200, redirects to idaq.com | Update to `https://idaq.com` |
| premiereyecare | http premier-eye-care.co.uk | 200, redirects | Update to `https://premiereyecare.co.uk` |
| barnsleyhypno | http barnsleyhypnosiscounselling.com | 200, https | Upgrade to https |
| meynellsfencing | http meynellsfencing.co.uk | 200, https | Upgrade to https |
| nfc | nationalfitnessconference.co.uk | **no response** | Remove link |
| acredula | http acredula.co.uk | 200, https | Upgrade to https |
| kittyandco | kittyandco.me | **no response** | Remove link |
| Twitter (header, landing) | twitter.com/Maelstromeous | not checked | Dropped (D5) |

Six dead, four redirected, six plain-http sites that now serve https, four fine as they are.

### D9: originals, previews and cards

- `portfolio/originals/` holds 18 PNGs. `portfolio/previews/` holds 18 JPGs with the **same 18
  names**. 17 cards exist; the 18th pair is `timefortea.png/jpg`, superseded by `timeforteav2`.
- Git history shows **no card template was ever deleted**. The only card filename that no longer
  exists is `tft.twig`, renamed to `timefortea.twig` in January 2017. Previews were reorganised
  in 2017 (a `previews/JPEG/` folder was flattened) but no project disappeared.
- So whatever was dropped for legal reasons was never committed here, or was removed before
  this repo started in July 2016. There is nothing to recover or to worry about.

## Phases

Each phase is one PR into the `vue-rebuild` branch, with the Vercel preview green. `vue-rebuild`
merges to `master` once, at cutover.

**Phase 1: scaffold.** Tasks 3 and 4. Two placeholder pages, full toolchain, `vercel.json`, CI.
Proves the build on Vercel before any content moves.

**Phase 2: content and components.** Tasks 5 and 6. Everything renders, unstyled.

**Phase 3: styles and behaviours.** Tasks 7, 8 and 11. The screenshot comparison drives this
phase to done.

**Phase 4: meta and decisions.** Tasks 9 and 10.

**Phase 5: cutover.** Tasks 12, 13 and 14, in the order task 12 spells out. Two PRs: the merge of
`vue-rebuild` (old stack still present, so the tree can be rolled back by repointing Cloudflare),
then the deletion PR a week later. Manual steps go at the top of each: Vercel production branch
and domains, Cloudflare origin, then the host's compose services, the two Docker Hub secrets, the
Docker Hub repository, the bot PRs and stale branches.

Rough size: phases 1 to 4 are two or three working sessions. Phase 5 is an hour plus the
Cloudflare change, then a week's wait.

## Out of scope

- Any content refresh beyond D7.
- Any deliberate design change beyond what Tailwind's defaults bring.
- A blog, a CMS, a contact form, or any server-side function.
- Rewriting git history to drop the screenshot originals.
- Moving DNS off Cloudflare.
