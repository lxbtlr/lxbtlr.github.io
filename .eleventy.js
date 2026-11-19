// Adapted from tommymcm/materials (MIT).

const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const metadata = require("./_data/metadata.json");

module.exports = function(eleventyConfig) {
  // Blog: code highlighting and an Atom feed of the latest posts
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 10 },
    metadata: {
      language: "en",
      title: metadata.title,
      subtitle: metadata.description,
      base: metadata.url + "/",
      author: { name: metadata.title }
    }
  });

  // Drafts: posts with `draft: true` render under `make serve` but are
  // left out of `make build`, so they never reach the deployed site.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // Copy static assets
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/@picocss/pico/css/pico.css": "assets/css/pico.css/style.css",
    // Atkinson Hyperlegible (SIL OFL 1.1), self-hosted
    "node_modules/@fontsource-variable/atkinson-hyperlegible-next/index.css": "assets/fonts/atkinson-next/index.css",
    "node_modules/@fontsource-variable/atkinson-hyperlegible-next/files": "assets/fonts/atkinson-next/files",
    "node_modules/@fontsource-variable/atkinson-hyperlegible-next/LICENSE": "assets/fonts/atkinson-next/LICENSE",
    "node_modules/@fontsource-variable/atkinson-hyperlegible-mono/index.css": "assets/fonts/atkinson-mono/index.css",
    "node_modules/@fontsource-variable/atkinson-hyperlegible-mono/files": "assets/fonts/atkinson-mono/files",
    "node_modules/@fontsource-variable/atkinson-hyperlegible-mono/LICENSE": "assets/fonts/atkinson-mono/LICENSE",
    // Data viewer and plots: SQLite in the browser, Vega-Lite charts
    "node_modules/sql.js/dist/sql-wasm.js": "assets/vendor/sql-wasm.js",
    "node_modules/sql.js/dist/sql-wasm.wasm": "assets/vendor/sql-wasm.wasm",
    "node_modules/vega/build/vega.min.js": "assets/vendor/vega.min.js",
    "node_modules/vega-lite/build/vega-lite.min.js": "assets/vendor/vega-lite.min.js",
    "node_modules/vega-embed/build/vega-embed.min.js": "assets/vendor/vega-embed.min.js",
  });
  // Published database exports and their views, beside each viewer page
  eleventyConfig.addPassthroughCopy("data/**/*.{sqlite,json}");

  // Head filter - get the first n items
  eleventyConfig.addFilter("head", function(array, n) {
    if(!Array.isArray(array)) {
      return array;
    }
    if(n < 0) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  // Sort filter - sorts array by property
  eleventyConfig.addFilter("sort", function(array, key) {
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  });

  // Reverse filter - reverses array
  eleventyConfig.addFilter("reverse", function(array) {
    if (!array || !Array.isArray(array)) return [];
    return [...array].reverse();
  });

  eleventyConfig.addFilter("dateFormat", function(date, format) {
    const d = new Date(date);

    const formats = {
      "yyyy-MM-dd": d.toISOString().split('T')[0],
      "MMM yyyy": d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        timeZone: 'UTC'
      }),
      "MMM d, yyyy": d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }),
      "MMMM d, yyyy": d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      })
    };

    return formats[format] || d.toString();
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Boxed, shaded text section. The blank lines around the content let
  // markdown inside the box (lists, code, links) render normally.
  //   {% box %}...{% endbox %}   or   {% box "Title" %}...{% endbox %}
  eleventyConfig.addPairedShortcode("box", function(content, title) {
    const heading = title ? `<p class="box-title">${title}</p>\n` : "";
    return `<div class="box">\n${heading}\n${content}\n\n</div>`;
  });

  // Photo gallery: markdown images inside are laid out side by side as
  // equal, cropped tiles, one column per image. Optional caption for the
  // whole gallery, and "wide" to bleed into the sidenote gutter like
  // <figure class="wide">. A markdown image title becomes that image's
  // own caption under its tile:
  //   {% gallery %}![a](/a.jpg "First") ![b](/b.jpg) ![c](/c.svg){% endgallery %}
  //   {% gallery "Caption", "wide" %}...{% endgallery %}
  // Inline <svg> markup works as a tile too.
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  eleventyConfig.addPairedShortcode("gallery", function(content, caption, wide) {
    // One column per markdown image or inline <svg>.
    const cols = (content.match(/!\[|<svg[\s>]/g) || []).length || 1;
    // Each markdown image becomes its own figure so it can carry a caption.
    const items = content.trim().replace(
      /!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)/g,
      (m, alt, src, title) =>
        `<figure class="gallery-item"><img src="${src}" alt="${escapeHtml(alt)}">` +
        (title ? `<figcaption>${escapeHtml(title)}</figcaption>` : "") +
        `</figure>`
    );
    const cls = wide === "wide" ? "gallery wide" : "gallery";
    const cap = caption ? `\n<figcaption>${caption}</figcaption>` : "";
    return `<figure class="${cls}" style="--cols: ${cols}">\n<div class="gallery-grid">\n\n${items}\n\n</div>${cap}\n</figure>`;
  });

  // Plots from a database export (lib/dbplot.js): live Vega-Lite chart with a
  // static SVG fallback and a link into the data viewer.
  //   {% dbplot "view name" %}   {% dbplot "view name", "Caption" %}
  //   {% dbplotcustom "Caption" %} ```sql ...``` ```json ...``` {% enddbplotcustom %}
  // An optional last argument picks the dataset from _data/datasets.json.
  const dbplot = require("./lib/dbplot");
  eleventyConfig.addAsyncShortcode("dbplot", dbplot.fromView);
  eleventyConfig.addPairedAsyncShortcode("dbplotcustom", dbplot.fromBlocks);

  // Margin block: floats into the sidenote gutter beside the text that
  // follows it, and drops inline on narrow screens like a sidenote. Keep
  // the content free of blank lines so markdown sees one HTML block.
  //   {% aside %}{% dbplot "view" %}{% endaside %}
  eleventyConfig.addPairedShortcode("aside", function(content) {
    return `<aside class="margin-block">${content.trim()}</aside>`;
  });

  // Sidenotes
  const sidenoteCounters = new Map();
  eleventyConfig.on('eleventy.before', () => {
    sidenoteCounters.clear();
  });
  eleventyConfig.addPairedShortcode("sidenote", function(content) {
    const key = this.page?.url ?? "default";
    const n = (sidenoteCounters.get(key) ?? 0) + 1;
    sidenoteCounters.set(key, n);
    return `<span class="sidenote-wrapper"><sup>${n}</sup><span class="sidenote"><sup>${n}</sup> ${content}</span></span>`;
  });

  // The card page must fit in one TCP packet: 1460-byte MSS minus
  // room for HTTP response headers. Warn when it outgrows that.
  const CARD_BUDGET = 1400;
  eleventyConfig.on('eleventy.after', ({ dir }) => {
    const fs = require("fs");
    const path = require("path");
    const card = path.join(dir.output, "card", "index.html");
    if (!fs.existsSync(card)) return;
    const size = fs.statSync(card).size;
    const status = size <= CARD_BUDGET ? "ok" : "OVER BUDGET";
    console.log(`[card] ${size}/${CARD_BUDGET} bytes (${status})`);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
