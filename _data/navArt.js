// Word art for the nav links, generated at build time with bouffont
// (https://github.com/meodai/bouffont). Returns { "<nav name>": "<svg …>" }
// for each entry in nav.json. bouffont draws in plain #000 / #fff; the
// .nav-art rules in style.css remap those to the theme colors.
const { readFile } = require("node:fs/promises");
const nav = require("./nav.json");

const FONT = "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff";

module.exports = async function () {
  const { bouffont, loadFont } = await import("bouffont");
  const font = await loadFont(await readFile(FONT));

  const art = {};
  for (const item of nav) {
    const piece = bouffont({ text: item.name, font, seed: item.seed, preset: item.preset, size: 60 });
    // Drop the fixed pixel size so CSS can scale the SVG by height.
    art[item.name] = piece.svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, '<svg$1 aria-hidden="true" focusable="false"');
  }
  return art;
};
