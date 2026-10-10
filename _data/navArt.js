// Word art for the nav links, generated at build time with bouffont
// (https://github.com/meodai/bouffont). Returns { "<nav name>": "<svg …>" }
// for each entry in nav.json. bouffont draws in plain #000 / #fff; the
// .nav-art rules in style.css remap those to the theme colors.
const nav = require("./nav.json");
const { render } = require("../lib/bouffont");

module.exports = async function () {
  const art = {};
  for (const item of nav) {
    const svg = await render(item.name, item.preset, item.seed);
    // Drop the fixed pixel size so CSS can scale the SVG by height.
    art[item.name] = svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, '<svg$1 aria-hidden="true" focusable="false"');
  }
  return art;
};
