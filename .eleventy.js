// Adapted from tommymcm/materials (MIT).

module.exports = function(eleventyConfig) {
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
  });

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
