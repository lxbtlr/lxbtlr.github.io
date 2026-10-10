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

module.exports = async function () {
  const frames = [];
  for (const preset of PRESETS) {
    const svg = await render(site.name, preset, "home");
    const viewBox = svg.match(/viewBox="([^"]*)"/)[1];
    const body = svg
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "")
      .replace(/(fill|stroke)="#000"/g, '$1="currentColor"')
      .replace(/fill="#fff"/g, 'style="fill:var(--paper)"')
      .replace(/stroke="#fff"/g, 'style="stroke:var(--paper)"');
    frames.push({ preset, viewBox, body });
  }
  return frames;
};
