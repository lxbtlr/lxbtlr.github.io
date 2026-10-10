// Shared bouffont setup for the build-time word art (_data/navArt.js,
// _data/homeArt.js, _data/themeArt.js). bouffont is ESM-only and can't
// read WOFF2, so this loads it dynamically with WOFF fonts: Atkinson
// Hyperlegible Next for words, Noto Sans Symbols 2 for the sun icon.
const { readFile } = require("node:fs/promises");

const FONTS = {
  text: "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff",
  symbols: "node_modules/@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff",
};

let lib;
const fonts = {};

async function load(which) {
  lib ??= import("bouffont");
  const { bouffont, loadFont } = await lib;
  fonts[which] ??= readFile(FONTS[which]).then(loadFont);
  return { bouffont, font: await fonts[which] };
}

// Render `text` with a preset; returns bouffont's SVG markup. `options`
// are passed through to bouffont, plus `font: "symbols"` to switch fonts.
async function render(text, preset, seed, options = {}) {
  const { font: which = "text", ...rest } = options;
  const { bouffont, font } = await load(which);
  return bouffont({ text, font, seed, preset, size: 60, ...rest }).svg;
}

// Drop bouffont's fixed pixel size so CSS can scale the SVG by height,
// and hide it from assistive tech (the parent link/button is labelled).
function inline(svg) {
  return svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, '<svg$1 aria-hidden="true" focusable="false"');
}

module.exports = { render, inline };
