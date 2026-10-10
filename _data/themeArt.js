// Sun icon for the light/dark toggle: the ☼ glyph from Noto Sans Symbols 2
// grown with bouffont's block preset. structure: false keeps the glyph's
// own outline (rays and centre) instead of redrawing it from centre lines.
const { render, inline } = require("../lib/bouffont");

module.exports = async function () {
  return inline(await render("☼", "block", "theme", { font: "symbols", structure: false }));
};
