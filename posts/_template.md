---
# POST TEMPLATE — ignored by Eleventy via .eleventyignore, so never built or listed.
#
# To write a post:
#   1. Copy this file to posts/<slug>.md  (page is served at /posts/<slug>/)
#   2. Set title, description and date below.
#   3. Keep `draft: true` while writing: `make serve` shows it, marked "draft",
#      but `make build` (and so the deployed site) leaves it out.
#   4. Delete the `draft: true` line to publish, then commit and push.
#
# Images: put them in assets/images/ and reference them as /assets/images/<file>.
title: Post Title
description: One-line summary shown on the blog list and in the feed.
date: 2026-01-01
draft: true
---

Opening paragraph. Regular **markdown** works, including [links](https://example.com)
and `inline code`.

## A section

Fenced code blocks get syntax highlighting:

```c
int main(void) {
    return 0;
}
```

Margin notes use the sidenote shortcode.{% sidenote %}This text appears in the margin on wide screens and inline on phones.{% endsidenote %}
Notes can hold images too.{% sidenote %}![Describe the image](/assets/images/<file>.jpg) Caption text after the image.{% endsidenote %}

<figure>
  <img src="/assets/images/<file>.jpg" alt="Describe the image">
  <figcaption>Caption.</figcaption>
</figure>

Images default to 75% of the text column, centered:

![Describe the image](/assets/images/<file>.jpg)

Add `class="wide"` to a figure to span the text column and the sidenote gutter:

<figure class="wide">
  <img src="/assets/images/<file>.jpg" alt="Describe the image">
  <figcaption>Wide caption.</figcaption>
</figure>

Boxed, shaded sections (title optional; markdown works inside):

{% box "Optional title" %}
Text, lists, `code`, and links all render inside the box.
{% endbox %}
