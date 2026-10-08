// Adapted from tommymcm/materials (MIT).

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/@picocss/pico/css/pico.css": "assets/css/pico.css/style.css",
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

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};
