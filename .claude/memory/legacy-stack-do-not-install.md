---
name: legacy-stack-do-not-install
description: Never run composer or npm install in site/; the old toolchain is EOL and is being deleted, not maintained
metadata:
  type: feedback
  volatility: durable
  lastVerified: 2026-09-03
---

Do not run `composer install`, `npm install` or the Grunt watch in `site/`. The PHP dependencies
(Twig 1, league/route 2, zend-diactoros 1, PHPUnit 6) and the Grunt LESS toolchain are years past
end of life and are the reason for the security alerts that started the migration.

**Why:** installing them pulls known-vulnerable packages onto my machine for no benefit, and any
"fix" to that stack is throwaway work. The only supported change to the live site before the
rebuild lands is editing Twig or LESS and letting the production workflow build the image.

**How to apply:** if the site needs checking, fetch the live pages or read the templates. Point
effort at `docs/migration-plan.md` instead. See [[project-vercel-migration]].
