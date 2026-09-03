---
name: project-vercel-migration
description: The site is moving off PHP to a static Vue 3 + Tailwind build on Vercel behind Cloudflare; decisions locked 2026-09-03, only analytics still open
metadata:
  type: project
  volatility: hot
  lastVerified: 2026-09-03
---

On 2026-09-03 I decided to retire the PHP/Twig/LESS/Grunt stack and rebuild the site as a static
Vue 3 site built with Vite and deployed on Vercel. The review is `docs/review-2026-09.md` and the
plan is `docs/migration-plan.md`; the plan carries the task list and the decision table.

Locked decisions:
- Vue 3, because I know it best and it looks plausible that I built it.
- Tailwind CSS v4, which I use everywhere now, in place of Bootstrap 3 and the LESS. I accept
  minor visual drift from Tailwind's components; I do not accept a redesign.
- Build happens on a branch. I wire that branch to a Vercel preview so Claude can inspect it.
- Cloudflare stays in front of the domain and I point it at Vercel myself. DNS does not move.
- Footer shows on the portfolio page and stays hidden on the landing page. Professional tab is
  linked. Spelling in card copy is fixed; wording and the 2020 skills lists are left alone.
- Twitter link is dropped, replaced by LinkedIn (`https://www.linkedin.com/in/mattcavanagh`). Dead project links are removed (card stays).
- Analytics: Cloudflare Web Analytics by default; GA4 only if I hand over a measurement ID.
- The Ansible vault and the two Docker Hub repo secrets are dead and go at cutover.

Still open: whether analytics is Cloudflare or GA4. Cloudflare is the default until I say.

**Why:** none of this is derivable from the code. Without it a session might propose SCSS,
a redesign, moving DNS, or a different framework, all of which have been ruled out.

**How to apply:** start from the plan's task list, not from re-reading the old PHP. Do not begin
the front-end migration until the plan is approved. See [[legacy-stack-do-not-install]].
