---
name: project-vercel-migration
description: The site is moving off PHP to a static Vue 3 + SCSS build on Vercel; decisions locked on 2026-09-03 and what is still my call
metadata:
  type: project
  volatility: hot
  lastVerified: 2026-09-03
---

On 2026-09-03 I decided to retire the PHP/Twig/LESS/Grunt stack and rebuild the site as a static
Vue 3 + SCSS site built with Vite and deployed on Vercel. The review is `docs/review-2026-09.md`
and the plan is `docs/migration-plan.md`; the plan carries the task list.

Locked decisions:
- Vue 3, because I know it best and it looks plausible that I built it.
- SCSS, with the tidied CSS structured like `satisfactory-factories/web` and `albionroads`.
- No visual redesign. The site is a first impression for many people; reproduce the look.
- I set up the Vercel project myself. The repo only needs to build to static output.
- The trigger for all of this was dependency security noise on a six-year-old stack, so the goal
  is zero runtime dependencies on the server and as few build dependencies as sensible.

Still my call, not Claude's: what to do with dead outbound links, whether the Twitter link
becomes X or goes, whether analytics returns (the old Universal Analytics property is dead), and
the "Last updated" content refresh.

**Why:** the constraints above are not derivable from the code. Without them a session might
propose a redesign, a different framework, or a backend, all of which have been ruled out.

**How to apply:** start from the plan's task list, not from re-reading the old PHP. Do not begin
the front-end migration until the plan is approved. See [[legacy-stack-do-not-install]].
