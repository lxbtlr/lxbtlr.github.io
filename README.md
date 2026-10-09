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
