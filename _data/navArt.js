// Word art for the nav links, generated at build time with bouffont
// (https://github.com/meodai/bouffont). Returns { "<nav name>": "<svg …>" }
// for each entry in nav.json. bouffont draws in plain #000 / #fff; the
// .nav-art rules in style.css remap those to the theme colors.
const nav = require("./nav.json");
const { render, inline } = require("../lib/bouffont");

module.exports = async function () {
  const art = {};
  for (const item of nav) {
    art[item.name] = inline(await render(item.name, item.preset, item.seed));
  }
  return art;
};
