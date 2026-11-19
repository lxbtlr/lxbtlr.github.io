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

Photo galleries put images side by side as equal, cropped tiles (one column
per image, two columns on phones). Caption optional; add "wide" to span the
sidenote gutter:

{% gallery "Optional caption" %}
![First](/assets/images/<file1>.jpg "Optional per-image caption")
![Second](/assets/images/<file2>.jpg)
![Third](/assets/images/<file3>.jpg)
{% endgallery %}

SVG diagrams are expected to handle dark mode themselves (draw.io: export
as SVG with adaptive colors). For an SVG that doesn't, add "#invert" to the
src (![diagram](/assets/images/<file>.svg#invert)) or class="invert" to an
inline <svg>: dark mode then swaps its black and white.

Plots from a database export (see README, "Data viewer and plots"). A chart
view by name, with an optional caption; readers get the live chart and a
link that opens its SQL and spec in the data viewer:

{% dbplot "2. bars: best mean time in sf", "Optional caption" %}

Or your own query and Vega-Lite spec, in the same two fenced blocks as a
view file:

{% dbplotcustom "Optional caption" %}
```sql
SELECT ...
```
```json
{ "mark": "bar", "encoding": { ... } }
```
{% enddbplotcustom %}
