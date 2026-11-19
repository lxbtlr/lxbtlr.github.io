# lxbtlr.github.io

Personal website for Alex Butler, built with [Eleventy](https://www.11ty.dev/) (v3),
Nunjucks templates and [Pico.css](https://picocss.com/).

## Local development

```sh
nix develop      # or `direnv allow` with .envrc
make serve       # http://localhost:8080
make build       # output in _site/
```

## Content

Structured content lives in `_data/`:

- `site.json` — name, title, contact info
- `news.json` — news roll on the home page (`date`, `text`)
- `publications.json` — publications roll on the home page (`year`, `title`, `authors`,
  `venue`, optional `url` for the title link and `pdf` for the PDF icon, which the
  title also links to when there is no `url`); newest year first
- `projects.json` — project cards; full pages live in `projects/*.md`
  (copy `projects/_template.md` to start a new one)
- `education.json`, `experience.json` — C/V page

`card.njk` renders `/card/`, a text-only summary kept under 1400 bytes so it fits in one
TCP packet; the build prints its size.

## Blog posts

Copy `posts/_template.md` to `posts/<slug>.md`. Posts with `draft: true` show under
`make serve` (marked "draft") but are left out of `make build` and the deployed site.
Delete that line to publish. The feed is at `/feed.xml`.

Theme colors are CSS variables at the top of `assets/css/style.css`.

## Data viewer and plots

Database exports are published with an in-browser SQL + Vega-Lite viewer, and posts can
embed plots from them. Datasets are listed in `_data/datasets.json` (folder, URL, database
and views file); moving a viewer means moving its folder and editing that entry.

- **TPC-H corpus:** viewer at `/data/tpch/`, files in `data/tpch/`. Views are written in
  `~/projects/Thunderous-Pupil/web/views/*.md`. `make sync-tpch DB=/path/to/export.sqlite`
  copies the export to `data/tpch/corpus.sqlite`, rebuilds `views.json` there (checking
  every query against the export) and copies it here, minus the views named in
  `data/tpch/views-exclude.txt`. Omit `DB=` to keep the current export. `make subset-tpch`
  instead cuts the export from the full corpus: the runs `data/tpch/runs.sql` selects.
- **Site views and figure data:** `data/tpch/views/*.md` are this site's own views (same
  markdown format as Thunderous-Pupil's), appended to `views.json` by `make sync-tpch`.
  `data/tpch/extra/<name>.csv` files from runs outside the corpus become table `<name>` in
  the published database (`make extra-tpch`, also run by `make subset-tpch`).
- **Plots in posts:** `{% dbplot "view name", "Caption" %}`, or `{% dbplotcustom %}` with a
  ` ```sql ` and a ` ```json ` block (see `posts/_template.md`). The query runs at build time;
  the page gets a static SVG, the result rows for the live chart, and an "open in data viewer"
  link carrying the SQL and spec. A bad query or missing database fails the build.
- **Chart style:** `_data/vegaConfig.json` holds site defaults under each spec's own config;
  text and axes use `currentColor`, so charts follow the light/dark toggle. The font is
  always the site's.
- **Code:** `lib/dbplot.js` (build), `assets/js/dbplot.js` (live charts),
  `_includes/layouts/dbviewer.njk` + `assets/js/dbviewer.js` (viewer, adapted from
  Thunderous-Pupil's `web/index.html`). sql.js and Vega come from npm and are served from
  `/assets/vendor/`.

## Deployment

`.github/workflows/deploy.yml` builds on push to `master` and deploys with GitHub Pages
Actions. Repository Settings → Pages → Source must be set to "GitHub Actions".

## Credits

Layout and templates adapted from [tommymcm/materials](https://github.com/tommymcm/materials)
(MIT License, Copyright (c) 2025 Tommy McMichen).

Fonts: [Paper Mono](https://github.com/paper-design/paper-mono) by Paper Design (based on
Geist Mono), SIL Open Font License 1.1, vendored in `assets/fonts/paper-mono/`, used for code.
Text:
[Atkinson Hyperlegible Next and Mono](https://www.brailleinstitute.org/freefont/)
by the Braille Institute, SIL Open Font License 1.1, installed via Fontsource.
