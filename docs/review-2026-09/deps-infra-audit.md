# mattcavanagh.me: dependency, pipeline, container and security audit

Repo: `Maelstromeous/mattcavanagh.me` (PUBLIC, confirmed via `gh repo view`). Audited 2026-09-03, read-only.
Scope: PHP + Node deps, GitHub workflows, provisioning/containers, security posture, Renovate, git history.
Not read: `provisioning/secrets.yml` (Ansible vault, header-only check confirmed `$ANSIBLE_VAULT`, 938 bytes). No `.env` files are tracked.

Severity key: [high] would bite or is already broken in production; [medium] real but tolerable until the switch; [low] tidy-up; [info] context.

---

## 1. PHP dependencies

Source: `site/composer.json`, `site/composer.lock`. No `php` platform constraint in composer.json; the effective PHP floor is set by the Docker base image (`php:7.4-fpm`, `provisioning/base/Dockerfile:1`). PHP 7.4 reached end of life 2022-11-28.

### Runtime (`require`)

| Package | Constraint (`composer.json` line) | Locked | Released | Status |
| --- | --- | --- | --- | --- |
| `league/container` | `^2.2` (L6) | 2.4.1 | 2017-05 | Very old; current is 5.x. Renovate PR #47 (v5) autoclosed. |
| `league/route` | `^2.0` (L7) | 2.0.2 | 2018-07 | Very old; current is 7.x. Pulls `nikic/fast-route` v0.7.0 (2015). Renovate PR #48 autoclosed. |
| `josegonzalez/dotenv` | `^2.0` (L8) | 2.1.0 | 2017-01 | **Declared but never used**: no reference in `site/src/**`; config reads `$_ENV` directly (`ConfigServiceProvider.php:20-24`). Pulls `m1/env` 2.2.0. |
| `zendframework/zend-diactoros` | `^1.3` (L9) | 1.8.7 | 2019-08 | **Abandoned** in favour of `laminas/laminas-diactoros` (lock marks it `abandoned`). 1.x had HTTP host-header injection CVEs fixed only in 1.8.4+/2.x; 1.8.7 has the last 1.x fix but the line is dead. |
| `twig/twig` | `^1.24` (L10) | v1.42.5 | 2020-02 | **EOL**. Twig 1.x ended 2020; 2.x ended 2023; only 3.x is supported. Renovate security PR #40 open (v3, marked `[SECURITY]`). |
| `container-interop/container-interop` | transitive | 1.2.0 | 2017-02 | Abandoned in favour of `psr/container`. |
| `psr/container` / `psr/http-message` | transitive | 1.0.0 / 1.0.1 | 2016-17 | Fine, but ancient. |
| `symfony/polyfill-ctype` | transitive | v1.17.0 | 2020-05 | Fine. |

### Dev (`require-dev`)

| Package | Constraint | Locked | Status |
| --- | --- | --- | --- |
| `phpunit/phpunit` | `^6.2` (L18) | 6.5.14 | EOL since 2019-02. Requires `php: ^7.0`; realistically PHP 7.0-7.2 (transitives like `phpdocumentor/reflection-docblock` 5.1.0 need `^7.2`). Renovate security PR #39 open (v8). |
| `phpunit/phpunit-mock-objects` | transitive | 5.0.10 | **Abandoned** (lock: `abandoned: true`). |
| `phpspec/prophecy` | transitive | v1.10.3 | Old; still maintained. |
| 25 other `sebastian/*`, `phpunit/php-*`, `phar-io/*`, `doctrine/instantiator`, `myclabs/deep-copy`, `webmozart/assert` | transitive | 2015-2020 | All PHPUnit 6 era. |

### Findings

- [high] Every runtime PHP package is EOL or abandoned; two have open `[SECURITY]` Renovate PRs (#39, #40). **Migration:** none of this survives; delete `site/composer.json`, `site/composer.lock`, `site/phpunit.xml`, `site/src/**`, `site/public/index.php`.
- [medium] `site/phpunit.xml:14` points at `./tests/`, which **does not exist** (`ls site/tests` fails). There are zero tests. **Migration:** nothing to port; the Vue site starts its test story from scratch.
- [medium] `TemplateServiceProvider.php:38` sets Twig cache to `__DIR__ . '/../../cache'` in production, which **does not exist** in the repo and is not created in any Dockerfile. Twig creates it on first render if the directory is writable (site is copied `--chown=www-data`, so it is). Works by accident. **Migration:** irrelevant to a static build.
- [low] `josegonzalez/dotenv` is dead weight (`composer.json:8`). **Migration:** deleted with the rest.
- [info] No `composer.json` `platform`/`php` constraint, so `composer validate` passes on any PHP; the PHP Composer Validation workflow is green for master but failed on Renovate PRs on 2026-08-30 (Renovate bumps that break the lock). **Migration:** delete the workflow.

---

## 2. Node dependencies

Source: `site/package.json`, `site/package-lock.json` (lockfileVersion 2, npm 7+ format, 171 locked packages). Lockfile is **npm**; no migration to pnpm needed because the whole Grunt toolchain is being deleted.

| Package | Constraint (`package.json` line) | Locked | Purpose | Renovate state |
| --- | --- | --- | --- | --- |
| `grunt` | `^1.5.3` (L7, in `dependencies`) | 1.5.3 | Task runner | PR #42 open (1.6.3) |
| `grunt-contrib-less` | `^2.1.0` (L10) | 2.1.0 | LESS to `public/assets/css/main.css` (`Gruntfile.js:8-19`) | PR #44 open (v3) |
| `grunt-contrib-uglify` | `^4.0.1` (L11) | 4.0.1 | **Loaded (`Gruntfile.js:3`) but no task configured**; JS is not minified | PR #45 open (v5) |
| `grunt-contrib-watch` | `^1.1.0` (L12) | 1.1.0 | Watch `public/assets/less/**` (`Gruntfile.js:20-28`) | none |

### Findings

- [medium] Dependabot has been patching transitive CVEs in this tree for years (PRs #22-#37, #51: `lodash`, `qs`, `braces`, `micromatch`, `tough-cookie`, `brace-expansion`, `websocket-driver`, `js-yaml`). It is build-time only, never shipped to the browser, so exposure is CI-only. **Migration:** delete `site/package.json`, `site/package-lock.json`, `site/Gruntfile.js`, `site/.jscsrc`, `site/public/prepros-6.config`.
- [low] `Gruntfile.js:12` has a typo `yuicomppress` (ignored option). `default` task is `less` + `watch`, i.e. the "build" never terminates; CI never runs it. Compiled `main.css` and `main.css.map` are committed. **Migration:** port the LESS source (`site/public/assets/less/*.less`, 12 files) to whatever the Vue site uses; do not copy the compiled CSS.
- [info] `site/.jscsrc` configures JSCS (dead linter, merged into ESLint 2016). Nothing runs it.
- [info] Compiled CSS `site/public/assets/css/main.css` is not in `.gitignore` and is committed (build output in source).

---

## 3. GitHub workflows (`.github/workflows/`)

| Workflow | File | Trigger | Does | Pushes to | Secrets | Action pins | Recent runs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Build & Deploy Production | `deploy-production.yml` | push to `master` (L3-4) | builds `provisioning/production/Dockerfile` (L48) for linux/amd64 with `VERSION=${{ github.sha }}` (L54-55) | Docker Hub `maelstromeous/mattcavanagh:production-<sha>` and `:production-latest` (L51-53) | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (L42-43) | `actions/checkout@v7`, `WyriHaximus/github-action-get-previous-tag@v1`, `docker/setup-qemu-action@v2`, `docker/setup-buildx-action@v2`, `docker/login-action@v2`, `docker/build-push-action@v7` | success (2026-08-03) |
| Build & Deploy Staging | `deploy-staging.yml` | push to `staging` (L3-4) | identical, `provisioning/staging/Dockerfile` | `maelstromeous/mattcavanagh:staging-<sha>`, `:staging-latest` | same | same | n/a (staging branch last pushed 2023-01) |
| Build base image | `build-base-image.yml` | cron `0 6 * * 1` Mondays + `workflow_dispatch` (L4-7) | builds `provisioning/base/Dockerfile` (context `provisioning/base`) | `maelstromeous/mattcavanagh:base` (L45) | same | same minus get-previous-tag | success weekly (last 2026-08-31) |
| Ansible Linter | `ansible-lint.yml` | push to `master`, `staging` | `ansible/ansible-lint-action@master` on 3 targets (L15-18) | n/a | none | `actions/checkout@v7`, `ansible-lint-action@master` (unpinned) | **failure on every run** (2026-07-27, 08-02, 08-03) |
| PHP Composer Validation | `validate-composer.yml` | push + PR to `master`, `staging` | `cd site && composer validate` | n/a | none | `actions/checkout@v7` | success on master, fails on Renovate PRs |

### Deploy mechanism (shape only)

There is **no deploy step in any workflow**. The workflows only push images to Docker Hub. Deploy is pull-based: `provisioning/docker-compose.yml:13,24` labels both services `com.centurylinklabs.watchtower.enable=true`, so a Watchtower instance on the deploy host polls Docker Hub for `:production-latest` / `:staging-latest` and restarts the container. No webhook URL, no deploy secret, no SSH from CI. The only secrets referenced anywhere are `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

### Findings

- [high] `ansible-lint.yml:16-17` targets `provisioning/production/k8s/provision-cluster.yml` and `provisioning/staging/k8s/provision-cluster.yml`, **neither of which exists** (`ls` fails; `git ls-files` shows no `k8s/` dir). The workflow has failed on every push for as long as the run history shows. **Migration:** delete the workflow.
- [medium] `deploy-*.yml` compute `NOW`, `SHORT_SHA` and `latesttag` (L19-29) and **never use them**; the `node: [20]` matrix axis (L11) is also unused. `WyriHaximus/github-action-get-previous-tag@v1` is a third-party action run for nothing (Renovate PR #56 wants to bump it). **Migration:** delete both deploy workflows; Vercel's Git integration replaces them.
- [medium] `build-base-image.yml` rebuilds a PHP 7.4 image **every Monday** from an EOL base, forever. **Migration:** delete the workflow and (separately, by hand) consider deleting or archiving the `maelstromeous/mattcavanagh` Docker Hub repository and rotating/removing `DOCKERHUB_TOKEN` from the repo secrets once nothing uses it.
- [low] `docker/setup-qemu-action@v2`, `setup-buildx-action@v2`, `login-action@v2` are 2 majors behind (Renovate PRs #52-#54 open). QEMU is pointless since `linux/amd64` only (arm builds removed 2023-07-21). **Migration:** moot.
- [low] `ansible/ansible-lint-action@master` is an unpinned mutable ref. **Migration:** moot.
- [info] `README.md:3-6` embeds badges for all three build workflows, one of which is permanently red. **Migration:** rewrite README.
- [info] After Vercel: every workflow here is redundant. Vercel builds on push; if a CI check is wanted, a single lint/typecheck/build workflow for the Vue app replaces all five.

---

## 4. Containers and provisioning (`provisioning/`)

### Images

| Image | File | Base | Notes |
| --- | --- | --- | --- |
| base | `base/Dockerfile` | `php:7.4-fpm` (L1, Debian) | Installs `sudo runit nginx git unzip` (L3-9), opcache (L12-13), Composer via `curl | php` unpinned (L14). Adds `www-data` to sudoers with `NOPASSWD:ALL` (L20-21). Remaps www-data to UID/GID 1000 (L24-25). Runs as `www-data` (L37) but `entrypoint.sh:4-6` immediately `sudo -u root runsvdir`. Renovate PR #55 wants `php:8` (would break Twig 1 / league 2). |
| production | `production/Dockerfile` | `maelstromeous/mattcavanagh:base` | Copies `production/files/nginx` to `/etc/nginx/conf.d` (L8), copies `./site` (L9), `composer install --no-dev` (L11). |
| staging | `staging/Dockerfile` | same | Identical except nginx conf. |
| dev | `dev/Dockerfile` | local `mattcavanagh:base` (L2) | Installs Node **11** via nodesource `curl | bash` (L6; Node 11 EOL 2019-06), `grunt-cli` global (L18). Built by `dev/main.yml`. |

### Process supervision

`runit` via `entrypoint.sh`: `runit/nginx/run` (nginx foreground) and `runit/docker-php/run` (`php-fpm --nodaemonize -R`). nginx talks to php-fpm on loopback port 9000 (`nginx/php-fpm.conf:2`, `php-fpm/www.conf:4`). `fastcgi_param HTTPS off` (`php-fpm.conf:6`) because TLS terminates at Cloudflare (`production.conf:8` comment).

### nginx security headers (`base/files/nginx/headers.conf`) to replicate in `vercel.json`

| Line | Header | Value | Keep? |
| --- | --- | --- | --- |
| 1 | `X-Frame-Options` | `SAMEORIGIN` | Yes (or CSP `frame-ancestors 'self'`). |
| 2 | `X-Content-Type-Options` | `nosniff` | Yes. |
| 3 | `X-Powered-By` | `yorkshire-tea` | Joke header; keep if wanted. Vercel does not add its own `X-Powered-By`. |
| 4 | `Content-Security-Policy` | `default-src 'self' 'unsafe-inline' data: *.jsdelivr.net unpkg.com *.cloudflare.com fonts.googleapis.com maxcdn.bootstrapcdn.com code.jquery.com *.google-analytics.com cdn.rawgit.com` | **Rewrite.** Single `default-src` with `'unsafe-inline'` and 9 CDN hosts, several dead or unused (see section 5). New CSP should enumerate only what the Vue build actually loads; ideally `'self'` plus a font host, no `unsafe-inline` if styles are bundled. |
| 5 | `X-XSS-Protection` | `1; mode=block` | Drop. Deprecated; modern browsers ignore it and it was a source of side-channel bugs. |
| 6 | `Referrer-Policy` | `no-referrer-when-downgrade` | Tighten to `strict-origin-when-cross-origin`. |

Missing today and worth adding on Vercel: `Strict-Transport-Security` (currently Cloudflare's concern), `Permissions-Policy`.

Also `nginx/php-fpm.conf:7` hides PHP's `X-Powered-By`. Not applicable on Vercel.

### Redirect and routing rules that must survive

- `production/files/nginx/production.conf:1-6`: **`www.mattcavanagh.me` 301 to `https://mattcavanagh.me$request_uri`**. Reproduce as a Vercel domain redirect (add `www` as a domain, redirect to apex) or a `vercel.json` redirect.
- `production.conf:17-19`: `try_files $uri $uri/ /index.php$is_args$args` (SPA-style fallback). Routes served: `/` and `/portfolio` only (`site/src/router.php:11-12`). A Vue SPA on Vercel needs a rewrite of all paths to `/index.html`, or static pre-render both routes.
- No caching headers are set anywhere (no `expires`, no `Cache-Control`, no `gzip` config). Cache-busting is `?v=<git sha>` query strings (`ConfigServiceProvider.php:20-25`). Vercel's default hashed asset caching supersedes this.
- Cloudflare sits in front (`production.conf:8`). Whether it stays in front of Vercel is a decision to make; if so, ensure SSL mode is Full (strict) and that Cloudflare cache rules do not fight Vercel's.

### Staging vs production differences

Only the nginx `server_name` and the `BASE_URL`/`ENVIRONMENT` env vars (`docker-compose.yml:9-11,20-22`). Staging has no www redirect. Twig cache and debug extension are toggled on `ENVIRONMENT === 'production'` (`TemplateServiceProvider.php:38-39,52-54`); `ga.js` is only injected in production (`template.twig:31-33`). The `staging` branch is 43 commits behind master, last pushed 2023-01-08. Vercel preview deployments replace staging entirely.

### Findings

- [high] `.dockerignore:1` reads `provisoning/secrets.yml` (typo, missing `i`), so the vault file **is in the Docker build context** for production/staging builds (context is repo root; `deploy-production.yml` sets no `context:`). It is not `COPY`'d (only `./site` and `provisioning/<env>/files/nginx` are, `production/Dockerfile:8-9`), so it does not reach the image. Latent, not leaking. **Migration:** the vault file and `.dockerignore` are both deleted; if the vault holds anything still live (unknown, not read), move it to the private webhooks repo first.
- [high] `base/Dockerfile:20-21` grants `www-data` passwordless sudo to root and `entrypoint.sh` uses it to run the supervisor as root. Any PHP RCE is a root-in-container. **Migration:** moot; Vercel is static.
- [medium] Base image pinned to `php:7.4-fpm` (EOL 2022-11) and rebuilt weekly, so it keeps picking up Debian package updates but never PHP fixes. **Migration:** moot.
- [medium] `provisioning/init.yml:24-25` aliases point at `provisioning/{production,staging}/k8s/provision-cluster.yml` with `--ask-vault-pass`; those playbooks do not exist. The k8s era was removed (commits 2023-01-07 "Added docker compose file for new infrastructure") but the aliases and the lint workflow were not. **Migration:** delete.
- [medium] `provisioning/dev/stop.yml:8-18` stops containers named `timefortea-dev`, `timefortea-db`, `timefortea-redis`: copy-pasted from a different project, never fixed. Running it would do nothing to this project's `mattcavanagh-dev` container. **Migration:** delete.
- [low] `provisioning/dev/main.yml:29-32` builds the dev image as `maelstromeous/applications:mattcavanagh-dev`, a different repo name from everything else. `init.yml:13` adds a `dev.` hosts entry. **Migration:** delete; `pnpm dev` replaces all of it.
- [low] `base/Dockerfile:14` installs Composer via `curl | php` with no checksum. `dev/Dockerfile:6` installs Node 11 via `curl | bash`. **Migration:** moot.
- [low] `php-fpm/www.conf:10` `clear_env = no` so `$_ENV` reaches PHP; `php/90-site.conf:1` sets an xdebug option in the base (non-dev) image where xdebug is not installed. Harmless. **Migration:** moot.
- [info] `docker-compose.yml:1` uses `version: "3"` (obsolete key, warns on modern Compose). Both services map container port 80 to two distinct host ports and rely on an external reverse proxy plus Cloudflare. **Migration:** the compose file and the host's Watchtower entry become dead once DNS points at Vercel; remove the two services from the host by hand.

---

## 5. Security

### External resources loaded by templates (complete list)

| File:line | URL | Type | Status |
| --- | --- | --- | --- |
| `site/template/template.twig:12` | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.1/css/all.min.css` | CSS | FA 5.12.1 (2020-01). No SRI. FA 6 current; 5.x unmaintained. |
| `template.twig:13` | `https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css` | CSS | Bootstrap 3.3.7 (2016). **EOL since 2019-07.** Known XSS in tooltip/popover `data-*` attrs (CVE-2018-14041, CVE-2018-14042, CVE-2019-8331; fixed in 3.4.1). Site uses tooltips (`global.js:1`). No SRI on the CSS. |
| `template.twig:19` | `https://oss.maxcdn.com/libs/html5shiv/3.7.2/html5shiv.js` | JS (IE<9 conditional) | Dead code path; no modern browser evaluates it. `oss.maxcdn.com` is a deprecated MaxCDN host. |
| `template.twig:20` | `https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js` | JS (IE<9 conditional) | Same. |
| `template.twig:27` | `https://code.jquery.com/jquery-3.1.1.min.js` | JS | jQuery 3.1.1 (2016). **CVE-2019-11358** (prototype pollution, fixed 3.4.0), **CVE-2020-11022/11023** (XSS in `htmlPrefilter`, fixed 3.5.0). No SRI. |
| `template.twig:28` | `https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js` | JS | Has SRI (`sha384-Tc5IQib…`) and `crossorigin`. Same CVEs as above. |
| `site/template/portfolio/index.twig:6` | `https://cdn.rawgit.com/konpa/devicon/master/devicon.min.css` | CSS | **rawgit.com shut down 2019-10.** The devicon icons on the portfolio page are broken today. The font files are committed at `site/public/assets/dist/devicon.*` but the CSS that references them is loaded from the dead CDN. |
| `site/public/assets/js/ga.js:4` | `https://www.google-analytics.com/analytics.js` | JS | Universal Analytics. |
| `site/template/common/header.twig:19`, `landing.twig:15` | `https://docs.google.com/document/d/1LA0YePMLR8M7KVZt8fdU-JcdUlKw4VLFomQvjuAi6q8` | link | CV as a Google Doc. Content link, not a resource load. |
| `header.twig:24,29`, `landing.twig:18,21` | twitter.com / github.com profile links | link | Content. Twitter link still says "twitter.com" and "Tweet me!". |
| `portfolio/index/cards/*.twig:7-11` | 17 client/project site URLs, 12 of them plain `http://` | link | Content. Several are likely dead (not checked; no network). |

Also served locally, unpinned copies: `site/public/assets/js/vendor/jquery.easing.1.3.js` (2008), `imagesloaded.pkgd.min.js` v4.1.1 (2016), `masonry.pkgd.min.js` v4.1.1 (2016). Loaded from `portfolio/index.twig:139-141`.

### Findings

- [high] jQuery 3.1.1 and Bootstrap 3.3.7 both carry known XSS CVEs and the page uses the affected tooltip feature. Exploitation needs attacker-controlled markup, which a static portfolio does not have, so real-world risk is low, but scanners will flag it. **Migration:** neither jQuery nor Bootstrap 3 goes into the Vue site.
- [high] `cdn.rawgit.com` has been dead since 2019; the devicon stylesheet 404s and the CSP whitelists a host that no longer exists. **Migration:** bundle devicon (npm `devicon`) or replace with a maintained icon set.
- [high] `ga.js:6` uses Universal Analytics property `UA-15631800-15`. **UA stopped collecting data 2023-07-01**; this script has done nothing for over two years, and the CSP entry for `*.google-analytics.com` is dead weight. **Migration:** decide: GA4, Vercel Web Analytics, Plausible, or nothing. Do not carry the UA ID.
- [medium] `ga.js:15,19,23,27,31` call `sendEvent()`; the function defined at `ga.js:34` is `sendGAEvent()`. Every tracked click in production throws `ReferenceError`. The `.cv` pageview at L10-13 fires first and would have worked while UA was alive. **Migration:** irrelevant, but proof the analytics never fully worked.
- [medium] `site/public/manifest.json:5-35` references `/android-icon-*.png` at the web root; the files are at `/assets/img/android-icon-*.png`. Manifest icons 404. `"name": "App"` is the generator default. **Migration:** regenerate the manifest with correct paths and a real name, or drop it.
- [medium] Only one of six CDN loads has SRI (`template.twig:28`). **Migration:** bundle everything; if any CDN remains, add SRI.
- [medium] CSP (`headers.conf:4`) allows `'unsafe-inline'` for all resource types and whitelists `unpkg.com` and `*.jsdelivr.net`, which no template uses. **Migration:** write a fresh, minimal CSP for the Vue build.
- [low] `site/public/test.html` ("Hello!") is a stray debug file served publicly. **Migration:** delete.
- [low] `TemplateServiceProvider.php:31-32` obfuscates the contact email as HTML entities. Harmless; the address is trivially decoded. **Migration:** keep the mailto if wanted; entity-obfuscation offers nothing.
- [low] 12 portfolio card links are `http://` (`cards/acredula.twig:7`, `barnsleyhypno.twig:7`, `battlestarlaser.twig:7`, `dig.twig:7`, `idaq.twig:7`, `makinsonmotors.twig:7`, `meynellsfencing.twig:7`, `nfc.twig:7`, `premiereyecare.twig:7`, `psb.twig:21`, `scriptmedia.twig:7`). **Migration:** check each still resolves; upgrade to https or remove.
- [info] Credential scan: grep over all tracked text files (excluding the vault) for password/secret/token/key/AKIA/ghp_/PEM shapes found **no committed credentials**. Matches were: workflow `${{ secrets.* }}` references (names only), the `NOPASSWD` sudoers line (`base/Dockerfile:21`), and `site/public/prepros-6.config:105-122` FTP/SFTP fields which are **all empty strings**. No `.env` files are tracked. The only secret-bearing file is the vault, which was not opened.
- [info] `provisioning/secrets.yml` is a 938-byte Ansible vault. What it holds is unknown. Its only consumer was the deleted k8s playbooks (`init.yml:24-25` pass `--ask-vault-pass`). It is almost certainly orphaned.

---

## 6. Renovate

`renovate.json` is the bare `config:recommended` preset (added by PR #38, merged 2026-07-27; an earlier attempt PR #28 autoclosed 2023-09). No `.github/dependabot.yml` exists, so the Dependabot PRs (#22-#37, #51) come from GitHub's repo-level security-updates setting, not a config file. Both bots run concurrently on the same npm tree.

### What Renovate is churning on (PRs #38-#56, six weeks)

| Area | PRs | State |
| --- | --- | --- |
| GitHub Actions majors | #43 checkout v7 (merged), #50 build-push v7 (merged), #52 login-action v4, #53 setup-buildx v4, #54 setup-qemu v4, #56 get-previous-tag v2 | 4 open |
| Docker base tag | #55 `php` v8 | open; would break the app |
| Composer majors | #46 dotenv v4, #47 league/container v5, #48 league/route v7, #49 zend-diactoros v2 | all **autoclosed** (Renovate could not produce a valid lock or they conflicted) |
| Composer security | #39 phpunit v8 `[SECURITY]`, #40 twig v3 `[SECURITY]` | open |
| Grunt | #42 grunt 1.6.3, #44 grunt-contrib-less v3, #45 grunt-contrib-uglify v5 | open |

Remote branches: 10 `renovate/*`, 1 `dependabot/*`, plus `dev` (last commit 2023-07-21) and `staging` (2023-01-08, 43 behind master).

### Findings

- [medium] 12 open bot PRs, none of which can be safely merged: the Composer ones need a PHP 8 rewrite, the Actions ones target workflows that will be deleted, the Grunt ones update a toolchain that will be deleted. Two Actions bumps were merged in August 2026 into workflows that are about to be removed. **Migration:** close all open Renovate/Dependabot PRs with a comment once the Vue branch is up; delete the `renovate/*`, `dependabot/*`, `dev` and `staging` remote branches.
- [low] `renovate.json` can stay for the Vue site, but should gain a `lockFileMaintenance` or grouping config so a 12-PR fan-out does not recur. **Migration:** keep the file, tune it after the new `package.json` lands.
- [info] After migration Renovate's surface shrinks to: one `package.json` (pnpm), one or two GitHub Actions if a CI workflow is kept, and nothing Docker/Composer.

---

## 7. Git history

- First commit: **2016-07-14** ("Init commit"). Total commits on `master`: **394**. The codebase is ten years old.
- Activity by year: 2016: 62, 2017: 112, 2018-19: 0, 2020: 97, 2021: 20, 2022: 53, 2023: 23, 2024: 14, 2025: 3, 2026: 10.
- Last human content commit: **2025-05-04** "Updated employment status" (the `header.twig:42-44` banner). Before that, 2023-07-21 "Updated header" and "Removed arm version builds".
- Last human infrastructure work: 2023-01-07/08 (move from k8s to docker-compose + Watchtower, Docker Hub repo rename).
- Everything since 2025-05 is bot merges (Dependabot 2025-07, 2026-01, 2026-07; Renovate 2026-07/08).
- `portfolio/index.twig:18` says "Last updated: 10/06/2020". The portfolio content is six years stale.

### Findings

- [info] The site has had no feature work since 2020 and no infra work since early 2023. Every 2024-2026 commit is dependency churn on a stack that is itself EOL. **Migration:** this justifies a rewrite over an upgrade; nothing in the PHP layer is worth porting.

---

## Files that can be deleted after migration

Everything below is dead once the Vue site is live on Vercel and DNS has moved.

- `.github/workflows/ansible-lint.yml` (already permanently failing)
- `.github/workflows/build-base-image.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/validate-composer.yml`
- `.dockerignore`
- `provisioning/` (entire tree: `base/`, `dev/`, `staging/`, `production/`, `docker-compose.yml`, `init.yml`, `vars.yml`, `secrets.yml` after checking with the owner whether the vault holds anything live)
- `site/composer.json`, `site/composer.lock`, `site/phpunit.xml`
- `site/package.json`, `site/package-lock.json`, `site/Gruntfile.js`, `site/.jscsrc`
- `site/src/` (entire PHP app)
- `site/template/` (Twig; port the *content* of `portfolio/index/cards/*.twig` and `landing.twig` first)
- `site/public/index.php`, `site/public/test.html`, `site/public/prepros-6.config`
- `site/public/assets/css/main.css`, `main.css.map` (compiled output)
- `site/public/assets/js/ga.js`, `global.js`, `portfolio.js`, `previews.js`, `vendor/*.js` (jQuery-dependent; rewrite in Vue)
- `README.md` badges (lines 3-6)
- Remote branches: `staging`, `dev`, all `renovate/*`, all `dependabot/*`
- Off-repo, by hand: Docker Hub repo `maelstromeous/mattcavanagh`; repo secrets `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN`; the two compose services and Watchtower label on the deploy host; the Cloudflare origin config if Cloudflare is dropped.

## Things that must survive the migration

- **Redirect:** `www.mattcavanagh.me` 301 to apex, preserving path (`production.conf:1-6`).
- **Routes:** `/` and `/portfolio` (`router.php:11-12`). Anything else 404s today; decide whether to keep that or add a proper 404 page.
- **Headers** (`headers.conf`): `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, a rewritten `Content-Security-Policy`, `Referrer-Policy` (tightened). Optionally the `X-Powered-By: yorkshire-tea` joke. Drop `X-XSS-Protection`. Add HSTS and Permissions-Policy.
- **Meta** (`common/meta.twig`): `og:image` (`assets/img/meta.png`), `og:url`, `og:description`, `og:type`, description text (`template.twig:5`), `theme-color #ffffff`, `msapplication-TileColor`/`TileImage`, viewport, `X-UA-Compatible` (can drop).
- **Titles:** landing "Matt Cavanagh - DevOps & Full stack Developer" (`landing.twig:3`); portfolio "Portfolio" (`portfolio/index.twig:3`).
- **Favicons / touch icons:** 9 `apple-icon-*.png`, `android-icon-*.png` (36-192), `favicon-16/32/96.png`, `favicon.ico`, `ms-icon-*.png` in `site/public/assets/img/`. Regenerate `manifest.json` with correct paths and a real `name`.
- **Content assets:** 17 project thumbnails as `.jpg` + `.png` pairs, ~30 AWS/tooling skill icons (`asg.png`, `ec2.png`, `terraform.png`, etc.), `devicon.*` fonts in `assets/dist/`. Portfolio card text and links from `template/portfolio/index/cards/*.twig`; the CV Google Doc link; GitHub/Twitter links (rename Twitter to X or drop); contact email.
- **Employment banner** (`header.twig:42-44`, "Currently happily employed") if still wanted.
- **Analytics decision:** UA is dead. Choose GA4 / Vercel Analytics / none before launch; do not carry `UA-15631800-15`.
- **Cache-busting:** replaced by Vercel hashed assets; nothing to port.
- **Cloudflare:** decide whether it stays in front of Vercel. If yes, SSL Full (strict) and no conflicting cache rules; if no, move DNS to Vercel nameservers or CNAME.
- **Renovate:** keep `renovate.json`, tune for a single pnpm `package.json`.
