# Front-end audit: mattcavanagh.me (site/public/assets/** and site/template/**)

Read-only inventory for the Vue 3 + SCSS rebuild. All paths relative to `site/`. Line refs as `file:line`. Tags: [high|medium|low|info] + one-line migration note.

Routes that exist (`src/router.php:11-12`): `/` -> `landing.twig`, `/portfolio` -> `portfolio/index.twig`. Nothing else is routed.

Twig globals used by templates (`src/ServiceProvider/TemplateServiceProvider.php:27-32,49`): `base_url`, `asset_url` (= base_url + `/assets`), `environment`, `version` (`?v=<hash>` cache-buster, used 20 times), `email` (HTML-entity-obfuscated `mailto:` href), `email_text` (entity-obfuscated address shown as text on landing), `current_path`. The value of the address is not reproduced here; read it from that file when building the data layer.

---

## 1. LESS

### 1.1 Import graph

`public/assets/less/main.less:1-9` imports, in order:

| # | File | Status |
| --- | --- | --- |
| 1 | `_variables.less` | used |
| 2 | `_typeography.less` (sic) | used |
| 3 | `_bootstrap-overrides.less` | used |
| 4 | `_style.less` | used |
| 5 | `_header.less` | used |
| 6 | `_footer.less` | used |
| 7 | `_cards.less` | used |
| 8 | `pages/portfolio.less` | used |
| 9 | `pages/landing.less` | used, and it re-imports `../_variables.less` (`pages/landing.less:1`) |

**Not imported by anything:**
- `less/header.less` (no underscore). [low] Dead: references `@spacing-base`, a variable that does not exist anywhere, so it would not even compile. Delete. Last touched 2020-02-16 (a581a85); `_header.less` is the live one.
- `pages/_portfolio.less` does NOT exist. `public/prepros-6.config:26` (import list) and the committed `public/assets/css/main.css.map` `sources` array both name it. [info] Stale editor config + stale source map; nothing to migrate.

### 1.2 landing.less is global, not page-scoped [high]

`main.less:9` pulls `pages/landing.less` into the single stylesheet loaded on every page (`template/template.twig:14`). Its unscoped rules therefore apply to the portfolio page too (confirmed in the compiled `public/assets/css/main.css`, last ~10 rules):

- `body { background-color: #eee; height: 100vh }` (`pages/landing.less:3-6`) overrides `@bg-color: #f7f7f7` from `_style.less:2`. **Rendered body background site-wide is `#eee`, not `#f7f7f7`.**
- `#header { margin-bottom: 0 }` (`:8-10`) overrides `_header.less:5` (`margin-bottom: 48px`). Spacing below the nav actually comes from `#employment` margin (`_header.less:89`, `margin: 0 -15px 30px -15px`).
- `#footer { display: none }` (`:12-14`). **The footer is hidden on every page, including /portfolio.** `footer#footer` in `_footer.less` styles an element that is never shown.

Migration note: "no visual redesign" means reproduce the *rendered* result (bg `#eee`, no footer, no header bottom margin), then decide separately whether to un-hide the footer. `prepros-6.config:31-36` shows landing.less was once compiled standalone; ec7adc7 (2020-06-10) added it to main.less and made it global.

### 1.3 Variables (`_variables.less`) -> SCSS

| Line | Variable | Value | Note |
| --- | --- | --- | --- |
| 1 | `@spacing` | `15px` | Bootstrap gutter |
| 2 | `@color` | `#5a5a5a` | body text and default link colour |
| 3 | `@bg-color` | `#f7f7f7` | overridden to `#eee` by landing.less (see 1.2) |
| 4 | `@border-color` | `#e2e2e2` | |
| 5 | `@link-color` | `#337ab7` | Bootstrap 3 link blue; also hard-coded in `pages/portfolio.less:48,53` |
| 6 | `@font-size` | `16px` | |
| 8 | `@v-base` | `24px` | vertical rhythm; everything is a multiple |
| 11 | `@xs` | `screen and (max-width: 767px)` | the only breakpoint actually used (`_header.less:50,71`, `_cards.less:36`, `pages/portfolio.less:71,98`, `pages/landing.less:35`) |
| 12 | `@tablet` | `screen and (max-width: 768px)` | unused |
| 13 | `@sm` | `screen and (min-width: 769px) and (max-width: 992px)` | unused |
| 14 | `@md` | `screen and (min-width: 993px) and (max-width: 991px)` | unused; impossible range (min > max) |
| 15 | `@lg` | `screen and (min-width: 992px) and (max-width: 1199px)` | unused |
| 16 | `@xl` | `screen and (min-width: 1200px)` | unused |
| 17 | `@4k` | `screen and (min-width: 2000px)` | unused |

Locally scoped variables worth keeping as tokens: `@green: #69bd3e`, `@red: #fb8e8e` (`_header.less:1-2`, employment banner); `@icon-multi: 2.2` (`pages/portfolio.less:1`, skills icons = round(24*2.2) = 53px); `@mod: 1.50` (`pages/portfolio.less:86`, card footer icons = 36px); `@icon-base` (`_style.less:38`, 36px). Other literal colours: `#b3b2b2` caption (`_typeography.less:30`), `#000` link hover (`:41`), `#ccc` borders (`_bootstrap-overrides.less:16,21,26`, `_header.less:74`, `_footer.less:5`), `#e8e8e8` card shadow (`_style.less:28`), `#f3f3f3` nav hover (`_header.less:31`), `#dadada` navbar shadow (`:25`), `#b5b5b5` card hover shadow (`_cards.less:24`), `#808080`/`#a9a9a9` featured card (`pages/portfolio.less:40-41`), `#eaeaea` card image border (`:64`), `#fff` everywhere. Hard-coded breakpoints not using variables: `max-width: 320px` (`_typeography.less:51,63,75`).

[medium] `_cards.less:35-36` nests `@media screen { @media @xs {...} }` where `@xs` already begins with `screen and`; compiled output is `@media screen and screen and (max-width: 767px)` which is invalid and is ignored. Harmless only because `.card-grid .card { margin-bottom: 24px }` (`_cards.less:48-50`) covers it. Do not port the nesting.

### 1.4 Fonts

- `_typeography.less:12`: `h1-h6 { font-family: 'Ubuntu', sans-serif }`. **No `@font-face` and no Google Fonts `<link>` anywhere** (grep over template/, less/, css/). Ubuntu renders only where installed locally; everyone else sees the platform sans-serif. [medium] Owner decision: load Ubuntu properly (a visible change for most visitors) or drop the name and keep the fallback (faithful to what is actually rendered).
- Icon fonts: Font Awesome 5.12.1 from cdnjs (`template.twig:12`), devicon from `https://cdn.rawgit.com/konpa/devicon/master/devicon.min.css` (`portfolio/index.twig:6`). [high] rawgit.com shut down in 2019; that stylesheet is dead in production, so devicon icons are almost certainly not rendering today. `public/assets/dist/devicon.{eot,svg,ttf,woff}` (1.0 MB, tracked in git) are **referenced by nothing** (no `@font-face`, no template). Migration: either ship devicon via npm/self-host or replace with SVGs; delete `assets/dist/`.

### 1.5 Compiled artifact

`public/assets/css/main.css` (5.8 KB) and `main.css.map` (2.9 KB) are committed compiled output (last compiled 2020-06-10, 129e248, same commit as the last LESS change; map is stale, see 1.1). `.gitignore` does not exclude them. [low] Dead weight in the rebuild: the SCSS build produces this.

### 1.6 Bootstrap 3 dependency surface

LESS that assumes Bootstrap 3 exists (styles that only make sense layered on BS3):
- `.row` margin (`_bootstrap-overrides.less:1`), `div[class^='col-']` gutter override to 12px (`:42-46`).
- `.nav-tabs > li > a`, `.nav-pills`, `.centered-tabs li { float: none }`, `.tab-content` (`:14-40`).
- `#header .navbar / .navbar-brand / .navbar-header / .navbar-default / .navbar-nav / .navbar-right / .navbar-toggle / .navbar-collapse` (`_header.less:9-83`), including the mobile collapse dropdown positioned at `top: 47px` (`:70-78`).
- `.jumbotron` (`pages/landing.less:27`).
- `.card` uses `.content;` as a LESS mixin call (`_cards.less:2`); `.content` itself (`_style.less:25-31`) is never used as a class in templates. In SCSS make it a `@mixin`/`%placeholder`.
- LESS functions used: `darken()` (`_cards.less:11`, `pages/portfolio.less:53`), `round()` (`pages/portfolio.less:11,15-16`), arithmetic on px. All have Sass equivalents (`color.adjust`/`darken`, `math.round`).

Bootstrap 3 classes used in templates (counts are occurrences across all twig files):
- Grid: `col-sm-6` (37), `col-md-4` (37), `col-xs-12` (7), `col-sm-5` (2), `col-sm-8`, `col-sm-offset-1`, `col-sm-offset-2`, `col-xs-offset-0`, `row` (9), `container-fluid` (1). No `.container` in any template (`body #main .container` in `_style.less:4-7` is dead).
- Responsive utilities: `visible-xs` (2), `hidden-xs`, `hidden-sm`, `visible-sm` (`portfolio/index.twig:96,109,114`). Used to swap `nav-tabs` (desktop) for `nav-pills` (xs/sm) and to show a mobile-only hint.
- Navbar: `navbar navbar-default navbar-fixed-top`, `navbar-header`, `navbar-toggle collapsed` + `data-toggle="collapse" data-target="#nav"`, `navbar-brand`, `collapse navbar-collapse`, `nav navbar-nav`, `navbar-right`, `active` (`common/header.twig:3-38`).
- Tabs: `nav nav-tabs centered-tabs`, `nav nav-pills centered-tabs`, `role="tablist"`, `tab-content`, `tab-pane active`, `data-toggle="tab"` (`portfolio/index.twig:110-134`, `portfolio/index/subnav.twig`).
- Components: `jumbotron`, `btn btn-primary btn-lg`, `btn btn-default` (`landing.twig:8-15`), `img-responsive` (17, every card image), `text-center` (24), tooltip via `data-toggle="tooltip"` (140 triggers) + `data-placement="bottom"` (header only).
- BS3 also supplies the base reset/typography (Helvetica Neue 14px body, `h3` etc.), `hr` styling, `small`, link colour `#337ab7` and the `.active` tab look. [medium] Migration: hand-write grid (3-col md / 2-col sm / 1-col xs), navbar, tabs/pills, jumbotron, two buttons, tooltip, and a minimal reset. Dropping Bootstrap entirely is feasible: the surface is ~15 components/utilities.

---

## 2. JavaScript

Load order (`template.twig:27-33`): jQuery 3.1.1 (CDN), Bootstrap 3.3.7 JS (CDN, SRI hash), `global.js`, page `{% block scripts %}`, then `ga.js` only when `environment == 'production'`. Portfolio adds (`portfolio/index.twig:139-143`): `vendor/jquery.easing.1.3.js` (8 KB), `vendor/imagesloaded.pkgd.min.js` (5 KB, v4.1.1), `vendor/masonry.pkgd.min.js` (24 KB, v4.1.1), `previews.js`, `portfolio.js`.

| Behaviour | Where | What it does | Vue 3 / CSS replacement |
| --- | --- | --- | --- |
| Tooltips | `global.js:1`, 140 `data-toggle="tooltip"` in templates | Bootstrap tooltip on hover, `title` attr as text, `data-placement="bottom"` in header only (default top elsewhere) | Small Vue directive or component: `title`-driven, CSS `::after` bubble with `opacity` transition. No library. Keep `title` for native fallback. |
| Tab switching | `global.js:2-5`, `portfolio/index/subnav.twig`, `portfolio/index.twig:121-134` | `.tab('show')` on click; `.tab-pane.active` shows one of 4 panes | `ref('all')` + `v-show`/`v-if` per pane; `aria-selected`/`role=tab`. The `#all/#featured/...` hrefs can map to hash routing if desired. |
| Masonry grid | `portfolio.js:3-13,40-50` | Masonry on each `.card-grid` with `.col-sm-6` items, re-laid out after imagesLoaded and again 50 ms later ("hack"); re-run on `shown.bs.tab` | Cards have varying heights, so plain CSS grid would leave gaps. Options: CSS `columns: 3` (order goes down columns, not across); CSS grid with `grid-auto-rows` + `grid-row: span N` (needs JS measurement); or accept row alignment (`align-items: start`). Owner call on how faithful the packing must be. |
| Image preview hover-scroll | `previews.js:1-41` | On `.preview` hover, animate `img.top` from 0 to `-(imgHeight - containerHeight)` at 500 ms per 100 px with `easeInOutSine`; on leave animate back at half speed with `easeOutSine`; skipped if overflow < 40 px | CSS: `.card-image img { transition: transform Xs ease-in-out } .card:hover img { transform: translateY(calc(-100% + 40vh)) }`. Duration proportional to height is not expressible in pure CSS; a fixed duration or a tiny `onMounted` height measurement gets equivalent feel. Drops jquery.easing entirely. |
| GA page + event tracking | `ga.js:1-43` | analytics.js (Universal Analytics, `UA-15631800-15`), pageview; click handlers on `.cv/.github/.twitter/.email/.project-link` send events labelled by `data-location` | UA was switched off by Google in July 2024, so this sends nothing. Replace with GA4 / Vercel Analytics or drop. |
| Card click-through | `portfolio.js:15-22` | On `.card.preview` click, navigate to `data-href` | No template sets `data-href` (grep: 0 hits). Dead. `pages/portfolio.less:32` has `cursor: pointer` commented out for the same reason. Drop. |
| "Show all technologies" toggle | `portfolio.js:24-36` | slideDown/Up `#all-techs` from `#all-techs-button` | Neither id exists in any template; `pages/portfolio.less:26-29` hides `#all-techs`. Dead. Drop. |
| Navbar collapse | `common/header.twig:6,13` (Bootstrap JS) | Hamburger toggles `#nav` on xs | `ref(open)` + class toggle; CSS for the dropdown from `_header.less:70-78`. |

Bugs:
- [high] `ga.js:15,19,23,27,31` call `sendEvent(...)` but the only definition is `sendGAEvent` (`ga.js:34`). Every tracked click throws `ReferenceError`; only the CV click's pageview (`:10-13`) ever fires. In the rebuild wire the event helper correctly (or drop events).
- [medium] `portfolio.js:24-36` `#all-techs-button` and `#all-techs` exist in no template. Dead code.
- [medium] `portfolio.js:15-22` `data-href` is set by no template. Dead code.
- [low] `ps2alerts.twig` card project link (`portfolio/index/cards/ps2alerts.twig:11`) lacks `data-location="project-card"` unlike all other cards, so its GA label would be `undefined`.
- [low] `portfolio/ps2alerts.twig:8` uses `{{ assets_url }}` (typo; global is `asset_url`) so the image src would be `/img/portfolio/ps2alerts.jpg` (also a path that does not exist; previews live in `previews/`). Moot: **no route renders this template** (`src/router.php` has only `/` and `/portfolio`). Delete the template.
- [low] `previews.js:9` `top` is computed and never used (shadowed by `progress`).

---

## 3. Content inventory

### 3.1 Cards (`template/portfolio/index/cards/*.twig`)

Tabs per `portfolio/index/{all,featured,personal,professional}.twig`. `all` order is the display order in the All tab. Featured flag = has `featured` class on the card root (`ps2alerts.twig:1`, `timefortea.twig:1`).

**[high] The Professional tab is unreachable.** `portfolio/index/subnav.twig` renders only three tab links (All, Featured, Personal). `portfolio/index.twig:131-133` renders the `#professional` pane, but nothing links to it. Reproduce as-is or add the fourth tab; owner call.

| id | Title | Project URL | GitHub | Category label | Date text | Featured class | Tabs | Tech icons (tooltip titles, in order) | Extra tooltips / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| timefortea | Time for Tea Vintage | https://www.timeforteavintage.co.uk | | Personal / Professional Project | Completed: April 2016 / Overhauled: January 2020 | yes | all(1), featured, personal | Bolt CMS (img), Bootstrap 3, Docker, Grunt, LESS, Photoshop CS5+, Kubernetes (fa-dharmachakra), PHP 5.5+ / 7 | fa-star: "This project is a demonstration of my latest design skills and mobile responsiveness techniques." / fas fa-flag: "I consider this my flagship website." Preview `previews/timeforteav2.jpg` |
| portfolio | My Portfolio | (none) | | Personal Project | Completed: January 2017 | no | all(2) only | Bootstrap 3, Docker, LESS, Kubernetes, PHP 5.5+ / 7 | No project link element. Only card absent from every filtered tab. |
| ps2alerts | PS2Alerts | https://www.ps2alerts.com | https://github.com/PS2Alerts | Personal / Collaborative Project | Started: October 2014 (Ongoing) | yes | all(3), featured, personal | AngularJS, Docker, Grunt, Kubernetes, LESS, Materalize CSS (img, `width="35"`), PHP 5.5+ / 7, NodeJS, Redis, Websockets (img, `width="35"`) | fa-star: "This is the largest personal project I've ever untaken, using multiple modules and services." / GitHub icon link: "View the source code for this project on GitHub." / fa-info-circle in body after "custom PHP API": "The repo for the API is private for security reasons, feel free to ask me for access." / fa-info-circle after date: "This project is continuously interated upon as the game changes. When I have free time, I continue to add more features to the project." Project link lacks `data-location`. |
| dig | Dignity of War | http://www.dignityofwar.com | | Personal / Community Project | Completed: December 2016 | no | all(4), personal (featured entry commented out `featured.twig:2-4`) | Bootstrap 4 Alpha v5, Bolt CMS (img), Docker, NodeJS, LESS, Mysql MariaDB | fa-certificate in title: "This project is brand new and under development. Please don't judge me too harshly!" / fa-info-circle after date: "This project is brand new and is ongoing. Further details will be available as they come. Ask me personally if you wish to find out more." |
| mariokart | Mariokart Race Tracker | https://www.mariokart.fun | | Personal Project | Completed: May 2017 | no | all(5), personal | Bootstrap 4 Alpha v5, LESS, Photoshop CS6 | Preview src has no `{{ version }}` |
| psb | Planetside Battles | https://psb.mattcavanagh.me (link text "PSB Archive") | | Community Project | Completed: January 2015 (inactive) | **no** (but listed in featured tab) | all(6), featured, personal | Symfony 2.6, Bootstrap 3, NodeJS, Websockets (img, `width="35"`), Redis, Photoshop CS5+ | fa-star: "This project was one of the largest I have ever undertaken, and the most technologically complex." / fa-trophy: "This website contributed to winning a Guinness Book of World Records for “Most Players Online in a single FPS battle”." / fa-info-circle after date: "I left the PSB team in January 2015 due to time constraint purposes. The site listed is for archive purposes." / Extra link after second `hr.half`: fa-trophy "Guinness World Record" -> http://www.guinnessworldrecords.com/news/2015/1/planetside-2-gamers-aiming-for-fps-battle-world-record-this-weekend-370414 |
| nsc | Nanite Systems Comics | https://www.nanitesystemscomic.com | | Community Project | Completed: November 2014 | no | all(7), personal | Laravel, Bootstrap 3, Photoshop CS5+ | |
| makinsonmotors | Makinson Motors | http://www.makinsonmotors.com/ | | Professional Project | Completed: January 2017 | no | all(8), professional | Bolt CMS (img), Bootstrap 4 Alpha 5, LESS | |
| scriptmedia | Script Media | http://www.scriptmedia.co.uk | | Professional Project | Completed: November 2016 | no | all(9), professional | Bolt CMS (img), Bootstrap 4 Alpha 5, LESS | Stray trailing `<br>` after category (`scriptmedia.twig:16`) |
| battlestarlaser | Battlestar Laser | http://www.battlestarlaser.com | | Professional Project | Completed: October 2016 | no | all(10), professional | Codeigniter 2 | |
| idaq | Idaq Networks | http://www.idaqnetworks.com | | Professional Project | Completed: September 2016 | no | all(11), professional | Bolt CMS (img), Bootstrap 3, Bower, Grunt, LESS | |
| premiereyecare | Premier Eye Care | http://www.premier-eye-care.co.uk | | Professional Project | Completed: July 2016 | no | all(12), professional | Bootstrap 3, LESS | |
| barnsleyhypno | Barnsley Hypnosis & Counselling | http://www.barnsleyhypnosiscounselling.com | | Professional Project | Completed: July 2016 | no | all(13), professional | Bootstrap 3, Bower, Grunt, LESS, Photoshop CS2+ | |
| meynellsfencing | Meynells Fencing | http://www.meynellsfencing.co.uk | | Professional Project | Completed: April 2016 | no | all(14), professional | Bootstrap 3 | Preview file is `previews/maynellsfencing.jpg` (a/e spelling mismatch with card id and title) |
| nfc | National Fitness Conference | http://www.nationalfitnessconference.co.uk | | Professional Project | Completed: ??? | no | all(15), professional | Bootstrap 3 | Date literally "???" |
| acredula | Acredula Group | http://www.acredula.co.uk | | Professional Project | Completed: January 2016 | no | all(16), professional | Bootstrap 3, Bower, Grunt, LESS, Photoshop CS2+ | Preview src has no `{{ version }}` |
| kittyandco | Kitty & Co | https://www.kittyandco.me | | Professional / Personal Project | Completed: April 2014 | no | all(17), professional | Codeigniter 2, Photoshop CS4 | |

Tab membership summary: all = 17 cards in the order above; featured = timefortea, ps2alerts, psb; personal = dig, ps2alerts, mariokart, timefortea, psb, nsc; professional = makinsonmotors, scriptmedia, battlestarlaser, idaq, premiereyecare, barnsleyhypno, meynellsfencing, nfc, acredula, kittyandco.

Card structure (identical across all 17): `.card.preview[.featured] > .card-image > img.img-responsive` ; `.card-content > h3.text-center (+ optional icons)`, `a.project-link[target=_blank][data-location=project-card]`, `<p>description</p>`, `<hr class="half">`, `<p>date<br>category</p>` ; `.card-footer.tech-icons > (i.devicon-*|img)[data-toggle=tooltip][title]`.

Icon image sources used inside cards: `bolt-grey.png` (via `{{ base_url }}/assets/img/`), `materalizecss-grey.png`, `websockets-grey.png` (via `{{ asset_url }}/img/`).

### 3.2 Card descriptions (verbatim, for the data file)

- **timefortea**: Time for Tea is my sister&rsquo;s business, who sells and hires out vintage crockery. This project puts into practice the responsive design and CSS skills I've learnt to so far and it's my first ever HTTPS &amp; HTTP2 fully compliant website. It has recently been overhauled and redesigned from the ground up to enhance the user experience based on their feedback - including providing a back office system (Bolt CMS) enabling Time for Tea to update various parts of the site on their own.
- **portfolio**: The site you&rsquo;re viewing! I decided it was time that I collated all the work I&rsquo;ve done so far into a single place, allowing people to browse my work, a bit about myself, and how to contact me.
- **ps2alerts**: A fan website which tracks a metagame known as &ldquo;Alerts&rdquo; in the MMOFPS game Planetside 2<sup>&reg;</sup>. This project is the most technical out of what I've done so far, using a multitude of technologies such as NodeJS, Redis and Websockets (including real-time components), as well as a custom PHP API [info-circle tooltip].
- **dig**: My gaming community's website, which is being built from the ground up to serve the community and it's members. We use a Discord bot (written in NodeJS) which also integrates with the site directly. My first collaborative project.
- **mariokart**: A fun project that I created for tracking the office Mariokart Wii competitions while I was working at Digital Velocity. It was good practice of Bootstrap 4 (Alpha v5) and responsive design practice. The website also provided a standing table which allowed us to keep track on how well we were doing.
- **psb**: Planetside Battles is a run player organisation of the MMOFPS Planetside 2<sup>&reg;</sup> who organises player vs player events. This project was my first technically challenging site, which used a databases, Redis, a NodeJS websocket collection script using a websocket based API, and real time commuication to browser clients. I also developed a Twich stream overlay which presented various statistics during the matches' casting.
- **nsc**: Nanite Systems Comics is a fan site publicising a fan based comic of the video game Planetside 2<sup>&reg;</sup>. This project was my first "proper" website which used a database and a custom image uploading / cropping system, within the Laravel framework.
- **makinsonmotors**: A Barnsley based used car dealership. The client wanted a website to demonstrate his stock to customers and allow easy access to contact him. I utilized Bolt in this project for it's ease of use with creating new / editing records and thumbnail generation.
- **scriptmedia**: Script Media, a design and branding company based in Barnsley, desired a new website showcasing their vast project portfolio and staff descriptions. Using Bolt, this was made simple for the staff to be able to keep the website up to date and fill it with new content.
- **battlestarlaser**: Battlestar Lazer is a Lazer Quest business in Mansfield. I developed their online booking system, which takes payments from customers and allows staff to manage their bookings.
- **idaq**: Idaq Networks are a wireless network company who provides Internet services for local businesses. This project was my first project using the Bolt CMS system.
- **premiereyecare**: An optician chain business. They wanted their current website updating into the modern age as their previous one was too hard to administrate. We took the design of the original website and converted it into more modern web standards.
- **barnsleyhypno**: Hypnosis and Counselling business located in Barnsley. Utilises a custom coded CMS system. Is also what I would regard as my first major project.
- **meynellsfencing**: Meynells fencing is a business based in Barnsley. They wanted a simple, attractive looking website which states their current prices.
- **nfc**: National Fitness Conference is a yearly conference. I made the entire website from scratch using a provided design.
- **acredula**: My ex-employer&rsquo;s main website, showing information about the business itself and it&rsquo;s subsidaries.
- **kittyandco**: Pet sitting service located in Henley-on-Thames, providing information about their services and contact information. This project was the first "customer focused" website I developed. Recently aquired by my sister, I developed the site to help her find customers.

(Typos such as "untaken", "interated", "commuication", "Twich", "subsidaries", "aquired", "Materalize" are in the source; the owner decides whether the rebuild keeps them.)

### 3.3 Verbatim page copy

**Landing** (`landing.twig`):
- `<title>` (`:3`): `Matt Cavanagh - DevOps & Full stack Developer`
- h1 (`:9`): `I make websites &amp; AWS platforms sing`
- h3 (`:10`): `Matt Cavanagh - Full stack web developer & DevOps Engineer`
- CTA primary (`:12`): `Check out my Portfolio!` -> `{{ base_url }}/portfolio` (`btn btn-primary btn-lg`)
- CTA secondary (`:15`): `Curriculum Vitae` -> Google Doc (`btn btn-default`)
- Social (`:17-27`): twitter (fa-3x, tooltip "Tweet me!"), github (tooltip "Check out my code on GitHub!"), email (tooltip "Shoot me an email!"), each with `data-location="landing"`
- Paragraph (`:28-30`): `{{ email_text|raw }}` (the obfuscated email address)

**Header** (`common/header.twig`):
- Brand (`:9`): `Matt Cavanagh` -> `{{ base_url }}`
- Nav (`:15-20`): `Portfolio` (active when `current_path == '/portfolio'`), `Curriculum Vitae` (Google Doc, `target=_blank`, class `cv`)
- Right (`:22-38`): twitter (fa-2x, "Tweet me!"), github ("Check out my code on GitHub!"), email ("Shoot me an email!"), all `data-placement="bottom"`, `data-location="header"`
- Employment banner (`:42-44`): `<div id="employment" class="not-available">Currently happily employed</div>` (red `#fb8e8e`; the `available` variant is green `#69bd3e`, unused)

**Footer** (`common/footer.twig:2-3`, currently hidden by CSS, see 1.2): `Copyright &copy; {{ 'now'|date('Y') }} Matt Cavanagh. All Rights Reserved.<br>All names, logos, and brands are property of their respective owners.`

**Portfolio** (`portfolio/index.twig`):
- `<title>` (`:3`): `Portfolio`
- h1 (`:13`): `My Portfolio & Skills`
- Intro (`:15`): `Below you'll find all of my past and current work - projects I feel reflect my skills as a web developer and a DevOps Engineer. There&rsquo;s a mixture of professional, personal and community projects, listing what technologies I&rsquo;ve used, completion dates and links to each (note some links may have changed designs!).`
- Last updated (`:18`): `Last updated: 10/06/2020`
- Skills caption (`:53`): `All tech I've used in the past and/or continue to use`
- AWS caption (`:92`): `AWS Services I've used`
- Mobile-only hint (`:99`, `visible-xs`): `<i class="fa fa-info-circle"></i> To view previews of the sites, simply tap the card. Hover events on mobile and whatnot.`
- Legal (`:105`): `<i class="fa fa-balance-scale"></i> <small>Legal: For works that are specified as "Professional", I forgo (and have never claimed) any ownership to the work.</small>`
- Tab labels (`subnav.twig`): `All Projects`; `Featured Projects` + fa-star tooltip `Projects I consider to be my best work.`; `Personal Projects`

**Meta description** (`template.twig:5`, overridable via `block description`, never overridden): `Matt Cavanagh is a full stack web developer turned DevOps Engineer based in the West Yorkshire town of Morley, United Kingdom, specializing in PHP and JavaScript applications.`

**Skills icons, general tech** (`portfolio/index.twig:26-50`, in order; `devicon-*` unless noted): AWS; AngularJS; Bootstrap 3 / 4 Alpha; Bolt CMS (img `bolt-grey.png`); Bower; Docker; Git; GitHub; Grunt; JavaScript; Jenkins (img `jenkins-grey.png`); jQuery; Kubernetes (`fas fa-dharmachakra`); LESS; Linux; Materialize CSS (img `materalizecss-grey.png`); Mysql / MariaDB; NGINX Webserver; NodeJS; Photoshop CS2+; PHP 5.5+ / 7; Redis; Terraform (img `terraform.png`); Ubuntu 16.04+; Websockets (img `websockets-grey.png`).

**Skills icons, AWS** (`portfolio/index.twig:60-87`, all `img/aws/<file>.png`): ASG (asg); Aurora (aurora); Beanstalk (beanstalk); Cert Manager (ACM) (cert-manager); CloudFormation (cloudformation); CloudWatch (cloudwatch); CodeCommit (codecommit); Cost Explorer (cost-explorer); EBS (ebs); EC2 (ec2); ECR (ecr); ElastiCache (elasticache); ELB / ALB / NLB (elb); Fargate (fargate); IAM (iam); Lambda (lambda); Organisations (organisations); RDS (rds); Redshift (redshift); Reserved Instances (reserved-instances); Route53 (route53); S3 (s3); SES (ses); VPG / Site to Site VPN (site-to-sitevpn); SNS (sns); SQS (sqs); Systems Manager (systems-manager); VPC (vpc).

---

## 4. Images (`public/assets/img/`, 101 files, 49 MB, all tracked in git)

| Group | Size | Files |
| --- | --- | --- |
| Favicons / app icons (root) | ~1.2 MB | android-icon-{36,48,72,96,144,192}, apple-icon-{57,60,72,76,114,120,144,152,180}, apple-icon.png, apple-icon-precomposed.png, favicon-{16,32,96}.png, favicon.ico, favicon.jpg, ms-icon-{70,144,150,310}, meta.png (og:image, 516 KB) |
| Tech logos (root) | ~130 KB | bolt-grey, jenkins, jenkins-grey, materalizecss-grey, materalizecss-grey-old, terraform, vagrant, vagrant-grey, websockets, websockets-grey |
| aws/ | 560 KB | 28 PNGs, all referenced |
| portfolio/originals/ | 40 MB | 18 PNGs |
| portfolio/previews/ | 6.5 MB | 18 JPGs |

Biggest 10 (all in originals/): acredula.png 7.1 MB, timefortea.png 5.5 MB, timeforteav2.png 4.8 MB, nsc.png 3.0 MB, portfolio.png 2.8 MB, barnsleyhypno.png 2.7 MB, scriptmedia.png 2.7 MB, psb.png 1.8 MB, maynellsfencing.png 1.8 MB, idaq.png 1.6 MB.

**Unreferenced** (basename grep across template/**, less/**, css/**, manifest.json):
- [high] `portfolio/originals/*` (all 18, 40 MB): nothing serves them. They are the source screenshots; keep out of the deploy (move to a non-published folder or LFS) and do not ship.
- [medium] `portfolio/previews/timefortea.jpg` (657 KB): card uses `timeforteav2.jpg`. Delete.
- [low] `jenkins.png`, `materalizecss-grey-old.png`, `vagrant.png`, `vagrant-grey.png`, `websockets.png`, `favicon.jpg`: unused colour/old variants. Delete.
- [low] `apple-icon.png`, `apple-icon-precomposed.png`, `favicon.ico`, `ms-icon-70x70.png`, `ms-icon-150x150.png`, `ms-icon-310x310.png`: not linked by `common/meta.twig` (browsers only auto-fetch `/favicon.ico` at site root, and this one lives under `/assets/img/`). Prune to a modern favicon set (ico + svg + 180 apple + 192/512 manifest).

Preview <-> card mismatches: `meynellsfencing.twig:3` loads `previews/maynellsfencing.jpg` (file and original both spelt "maynells"; card, title and URL are "meynells"). Every other card has a same-named preview. `timefortea` card -> `timeforteav2.jpg`. No preview lacks a card except `timefortea.jpg` (superseded).

Inconsistent referencing: `bolt-grey.png` is always `{{ base_url }}/assets/img/...` while the other tech images use `{{ asset_url }}/img/...` (same resolved path). Card image `src` cache-buster `{{ version }}` is missing on `acredula`, `mariokart`.

[medium] `public/manifest.json` is broken: `"name": "App"` (placeholder) and every icon `src` is `/android-icon-*.png` at site root, but the files are at `/assets/img/android-icon-*.png`. `common/meta.twig:22` links it. In the rebuild put icons where the manifest says or fix the paths, and set a real name.

---

## 5. External links (owner to check liveness; not fetched)

| Link | Where |
| --- | --- |
| https://docs.google.com/document/d/1LA0YePMLR8M7KVZt8fdU-JcdUlKw4VLFomQvjuAi6q8 (CV) | `common/header.twig:19`, `landing.twig:15` |
| https://www.twitter.com/Maelstromeous | `common/header.twig:24`, `landing.twig:18`. [info] Owner call: rebrand to X, or drop. |
| https://github.com/Maelstromeous | `common/header.twig:29`, `landing.twig:21` |
| https://github.com/PS2Alerts | `cards/ps2alerts.twig:9` |
| https://www.timeforteavintage.co.uk | `cards/timefortea.twig:10` |
| https://www.ps2alerts.com | `cards/ps2alerts.twig:11` |
| http://www.dignityofwar.com | `cards/dig.twig:7` |
| https://www.mariokart.fun | `cards/mariokart.twig:7` |
| https://psb.mattcavanagh.me | `cards/psb.twig:9` |
| http://www.guinnessworldrecords.com/news/2015/1/planetside-2-gamers-aiming-for-fps-battle-world-record-this-weekend-370414 | `cards/psb.twig:21` |
| https://www.nanitesystemscomic.com | `cards/nsc.twig:7` |
| http://www.makinsonmotors.com/ | `cards/makinsonmotors.twig:7` |
| http://www.scriptmedia.co.uk | `cards/scriptmedia.twig:7` |
| http://www.battlestarlaser.com | `cards/battlestarlaser.twig:7` |
| http://www.idaqnetworks.com | `cards/idaq.twig:7` |
| http://www.premier-eye-care.co.uk | `cards/premiereyecare.twig:7` |
| http://www.barnsleyhypnosiscounselling.com | `cards/barnsleyhypno.twig:7` |
| http://www.meynellsfencing.co.uk | `cards/meynellsfencing.twig:7` |
| http://www.nationalfitnessconference.co.uk | `cards/nfc.twig:7` |
| http://www.acredula.co.uk | `cards/acredula.twig:7` |
| https://www.kittyandco.me | `cards/kittyandco.twig:7` |

Eleven project links are plain `http://`. CDN/asset URLs: Font Awesome 5.12.1 (cdnjs), Bootstrap 3.3.7 CSS+JS (maxcdn.bootstrapcdn.com), jQuery 3.1.1 (code.jquery.com), html5shiv/respond.js (oss.maxcdn.com), devicon (cdn.rawgit.com, dead host). All `target="_blank"` links lack `rel="noopener noreferrer"`.

---

## 6. Accessibility / SEO quick pass

| Tag | Finding | Where | Migration note |
| --- | --- | --- | --- |
| [high] | 59 `<img>` with no `alt` (all 17 card previews, all 28 AWS icons, all tech-logo images) | cards/*.twig:3, `portfolio/index.twig:29,36,41,48,50,60-87`, card footers | Give icons `alt` = tooltip title; previews `alt="Screenshot of <title>"`. |
| [medium] | `alt` attribute on `<a>` (invalid; should be `aria-label` or `title`) | `common/header.twig:24,29`, `landing.twig:18,21,24` | Use `aria-label`. |
| [medium] | Icon-only links/buttons have no text: social `<a>` wrap only `<i>`; navbar toggle has no `sr-only` label | `common/header.twig:6-8,24-36`, `landing.twig:18-26` | `aria-label` on each. |
| [medium] | Tooltip text lives only in `title` on `<i>` elements (140 of them); not keyboard reachable, and icon-only `<i>` conveys meaning with no text alternative | everywhere `data-toggle="tooltip"` | Vue tooltip component with `aria-describedby`, or `<span class="sr-only">`. |
| [medium] | `<meta property="description">` should be `name="description"`; as written, search engines ignore it | `common/meta.twig:6` | Fix attribute. |
| [medium] | No `og:title`, no `twitter:*`, no `<link rel="canonical">` | `common/meta.twig` | Add per page. |
| [low] | Heading order: landing h1 -> h3 (no h2); portfolio h1 -> card h3s (no h2). Only `ps2alerts.twig` (unrouted) has an h2 | `landing.twig:9-10`, `portfolio/index.twig:13`, cards `:6` | Cards can be h2 with same visual size, or keep h3 and accept. |
| [low] | `<html lang="en">` present, good. `<meta charset>` and viewport present | `template.twig:2`, `common/meta.twig:1,3` | Keep. |
| [low] | IE conditional comments (html5shiv, respond.js) and `X-UA-Compatible IE=edge` | `template.twig:17-21`, `common/meta.twig:2` | Drop. |
| [low] | `og:image` is a 516 KB PNG (`meta.png`) | `common/meta.twig:4` | Re-encode. |
| [low] | Tab panes use `role="tabpanel"` and tabs `role="tab"`/`aria-controls`, but no `aria-selected`/`aria-labelledby`, and the pills copy (xs/sm) lacks `role="tablist"` | `portfolio/index.twig:110-134`, `subnav.twig` | Complete the ARIA tab pattern in the Vue component. |
| [low] | HTML comment "Collect the nav links, forms..." is Bootstrap boilerplate | `common/header.twig:12` | Drop. |
| [info] | `<title>` on portfolio is just `Portfolio` (no site name) | `portfolio/index.twig:3` | Consider `Portfolio - Matt Cavanagh`. |

---

## Dead weight to delete

- `public/assets/less/header.less` (unimported, references nonexistent `@spacing-base`).
- `public/assets/css/main.css`, `main.css.map` (compiled artifacts; map is stale).
- `public/assets/dist/devicon.{eot,svg,ttf,woff}` (1.0 MB, referenced by nothing).
- `public/assets/js/vendor/{masonry,imagesloaded}.pkgd.min.js`, `jquery.easing.1.3.js` (replaced by CSS/Vue).
- `public/assets/js/portfolio.js:15-36` (data-href click-through and `#all-techs` toggle: no matching markup), `pages/portfolio.less:26-29` (`#all-techs`).
- `public/assets/js/ga.js` as-is (UA property is dead; `sendEvent` bug).
- `template/portfolio/ps2alerts.twig` (unrouted, `assets_url` typo, nonexistent image path).
- `public/test.html` ("Hello!"), `public/prepros-6.config` (editor config with a stale import list).
- Images: `portfolio/originals/*` (40 MB, keep out of the deploy), `portfolio/previews/timefortea.jpg`, `jenkins.png`, `materalizecss-grey-old.png`, `vagrant.png`, `vagrant-grey.png`, `websockets.png`, `favicon.jpg`, unlinked icon variants (`apple-icon.png`, `apple-icon-precomposed.png`, `ms-icon-{70,150,310}`, root-less `favicon.ico`).
- LESS rules with no matching markup: `body #main .container` (`_style.less:4-7`), `.double-row`, `.no-padding`, `.no-side-margin`, `.row-splitter` (`_bootstrap-overrides.less:5-8`, `_style.less:33-35,51-58,67-71`), `#employment.available` (`_header.less:91-93`, keep if the banner state will be toggled), unused breakpoint variables `@tablet @sm @md @lg @xl @4k`.
- IE shims and `X-UA-Compatible`; Bootstrap 3 + jQuery CDN loads; `featured.twig:2-4` commented-out dig include.
- HTML boilerplate comment `common/header.twig:12`.

## Must reproduce exactly

- Rendered body background `#eee` (not `#f7f7f7`), text `#5a5a5a`, `16px/24px`, `h1 3em / h2 2.25em / h3 1.75em` with the 767px and 320px step-downs (`_typeography.less`). Heading font as actually rendered: platform sans-serif unless the owner opts to load Ubuntu.
- Header: fixed white navbar, 48px tall, `box-shadow: 0 0 10px #dadada`, brand + "Portfolio" + "Curriculum Vitae", right-aligned twitter/github/email icons (`fa-2x`, bottom tooltips), li hover `#f3f3f3`; xs: hamburger, full-width white dropdown at `top: 47px` with `#ccc` bottom border, right icons centred inline. Then the full-width `#employment.not-available` red (`#fb8e8e`) banner "Currently happily employed", white text, `padding: 5px 0`, `margin: 0 -15px 30px`.
- Footer hidden (`display: none`) on every page; copyright text exists in markup only.
- Landing: `#landing` 91vh flex column centred, `.jumbotron` (BS3 grey `#eee` block, padding 15px, radius) with h1 "I make websites & AWS platforms sing", h3 tagline, `btn-primary btn-lg` "Check out my Portfolio!", `btn-default` "Curriculum Vitae", three `fa-3x` social icons spaced `0 5px`, obfuscated email text paragraph; xs: jumbotron padding 0, `font-size: 0.9em`, heading line-height 30px.
- Portfolio: centred intro column (`col-sm-8 offset-2`), two skills columns (`col-sm-5 offset-1` / `col-sm-5`) of 53px icons with tooltips, `p.caption` `#b3b2b2 0.9em`, xs-only tap hint, legal line with `fa-balance-scale`, centred `nav-tabs` (md+) / `nav-pills` (xs/sm) with three tabs (All / Featured + star tooltip / Personal), `tab-content` with All active by default.
- Card: white, `1px solid #e2e2e2`, radius 3px, shadow `0 0 10px #e8e8e8`, hover shadow `0 0 10px #b5b5b5`, `transition: all .2s ease-in`, `font-size: .9em`, `padding-bottom: 12px`, `margin-bottom: 24px`; `.featured` variant border `#808080` + shadow `0 0 10px #a9a9a9`; `.card-image` 40vh (60vw on xs), `min-height: 96px`, overflow hidden, `1px solid #eaeaea` bottom border, image absolutely positioned top 0 and scrolled on hover; h3 centred with margin-bottom 0; `.project-link` block, centred, 1.3em, `#337ab7` (hover `#1d4567`, underline), `word-break: break-all`; body copy p with margin 0; `hr.half` 11px margins; `.card-footer` top border `#e2e2e2`, `padding: 10px 15px 0`, floated 36px icons with 5px right margin, centred on xs.
- Grid: 3 columns at md+ (`col-md-4`), 2 at sm (`col-sm-6`), 1 at xs, 12px gutters, masonry-packed heights, in the exact per-tab order listed in 3.1.
- All 17 cards with the exact titles, URLs, link text ("PSB Archive" for psb), dates, category labels, tooltip strings and tech-icon lists in 3.1/3.2; Professional pane exists but is not linked (owner decides whether to expose it).
- Meta: description text, `og:image` meta.png, `og:url`, `og:type website`, theme-color `#ffffff`, apple-touch-icon set, 16/32/96/192 PNG favicons, manifest link.
