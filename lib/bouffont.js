// Shared bouffont setup for the build-time word art (_data/navArt.js,
// _data/homeArt.js). bouffont is ESM-only and can't read WOFF2, so this
// loads it dynamically with the WOFF cut of Atkinson Hyperlegible Next.
const { readFile } = require("node:fs/promises");

const FONT = "node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff";

let ready;
function load() {
  ready ??= (async () => {
    const { bouffont, loadFont } = await import("bouffont");
    const font = await loadFont(await readFile(FONT));
    return { bouffont, font };
  })();
  return ready;
}

// Render `text` with a preset; returns bouffont's SVG markup.
async function render(text, preset, seed) {
  const { bouffont, font } = await load();
  return bouffont({ text, font, seed, preset, size: 60 }).svg;
}

module.exports = { render };
