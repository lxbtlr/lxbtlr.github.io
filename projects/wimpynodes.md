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
title: Wimpy Nodes
description: Wimpy Node Clusters for Database Query Processing
---

<figure>
  <img src="/assets/images/wimpynodes_header.jpg" alt="Describe the image">
  <figcaption>Wimpy Node Clusters.</figcaption>
</figure>

Server grade hardware is large and expensive (TCO) and overkill for performing many simple tasks.
Wimpy nodes strike an interesting balance between performance and TCO, and in many cases, they perform on the same scale as larger brawny nodes.

Prior work has shown the performance of wimpy nodes vs their server grade counterparts in single node tests. Our work is focused on how we can leverage clusters of these nodes to tackle larger tasks that a single wimpy node would not be able to process.

(this work is still in progress)


<!-- Optional video or slide embed: -->
