---
# PROJECT TEMPLATE — ignored by Eleventy via .eleventyignore, so never built or listed.
#
# To add a project:
#   1. Copy this file to projects/<slug>.md  (page is served at /projects/<slug>/)
#   2. Put images in assets/images/ and reference them as /assets/images/<file>.
#   3. Add a card entry to _data/projects.json (order there = order on /projects/):
#        {
#          "name": "Project Name",
#          "desc": "One-line summary shown on the projects page.",
#          "url": "/projects/<slug>/",
#          "img": "/assets/images/<slug>_header.jpg"
#        }
layout: layouts/page.njk
title: Project Name
description: One-line summary of the project
---

<figure>
  <img src="/assets/images/<slug>_header.jpg" alt="Describe the image">
  <figcaption>Caption for the header image.</figcaption>
</figure>

Opening paragraph: what the project is, when and why you did it.

Second paragraph: your role, what you built, what you learned. Link out with
[markdown links](https://example.com).

## Section heading

More detail, results, or write-up.

<!-- Optional video or slide embed: -->
<figure>
  <iframe class="embed" src="https://www.youtube.com/embed/VIDEO_ID" title="Video title" allowfullscreen></iframe>
  <figcaption>Video caption.</figcaption>
</figure>
