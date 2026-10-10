// Frames for the home link's hover animation: the site name drawn once per
// bouffont preset. home-art.njk writes them into one cached sprite
// (/assets/home-art.svg) and the header cycles through them with CSS.
//
// The sprite is used via <use>, where page CSS selectors can't reach, so
// the colors are rewritten here: #000 ink becomes currentColor and #fff
// paper becomes the theme's --paper variable (custom properties do inherit
// into <use> content).
const site = require("./site.json");
const { render } = require("../lib/bouffont");

const PRESETS = ["block", "throwup", "bubble", "candy", "bubbles", "marquee", "simple", "crowd"];

// The frames display at .home-frames' height (2.08rem = 33.28px at the
// default 16px root). bouffont's outlines come out around 0.3-0.6px at
// that size, so every stroke is widened to at least MIN_STROKE_PX on screen.
const DISPLAY_HEIGHT_PX = 33.28;
const MIN_STROKE_PX = 1.25;

module.exports = async function () {
  const frames = [];
  for (const preset of PRESETS) {
    const svg = await render(site.name, preset, "home");
    const viewBox = svg.match(/viewBox="([^"]*)"/)[1];
    // Frames are drawn with <use>, which places the symbol at 0,0; size
    // the outer SVG from 0,0 too so the negative viewBox origin is kept.
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    const minStroke = (MIN_STROKE_PX * height) / DISPLAY_HEIGHT_PX;
    const body = svg
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "")
      .replace(/(fill|stroke)="#000"/g, '$1="currentColor"')
      .replace(/fill="#fff"/g, 'style="fill:var(--paper)"')
      .replace(/stroke="#fff"/g, 'style="stroke:var(--paper)"')
      .replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${Math.max(+w, minStroke).toFixed(2)}"`);
    frames.push({ preset, viewBox, width, height, body });
  }
  return frames;
};
