// Build the site's views.json from Thunderous-Pupil's: drop the views named
// in an exclude list, then append this site's own views.
//   node lib/filter-views.js <in views.json> <exclude.txt> <out views.json> [views dir]
// Exclude list: one view name per line; blank lines and # comments ignored.
// Fails on a name that matches no view, so a renamed view isn't silently kept.
// Site views are markdown files in the same format as Thunderous-Pupil's
// web/views/*.md (H1 name, optional `tab: chart|table`, prose, a ```sql
// block and, for charts, a ```json Vega-Lite spec), read in filename order.
const fs = require("fs");
const path = require("path");
const [src, excludeFile, out, viewsDir] = process.argv.slice(2);

// Mirrors parse_md in Thunderous-Pupil's bin/build-views.
function parseView(file) {
  const name0 = path.basename(file, ".md").replace(/^\d+[-_]/, "").replace(/-/g, " ");
  let name = null, tab = "table", lang = null, buf = [], seenFence = false;
  const prose = [], blocks = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (lang === null) { lang = (fence[1] || "text").toLowerCase(); buf = []; seenFence = true; }
      else { blocks[lang === "sql" ? "sql" : "json"] = buf.join("\n").trim(); lang = null; }
      continue;
    }
    if (lang !== null) { buf.push(line); continue; }
    if (name === null && line.startsWith("# ")) { name = line.slice(2).trim(); continue; }
    if (!seenFence) {
      const meta = line.trim().match(/^tab:\s*(\w+)$/);
      if (meta && name !== null) tab = meta[1].toLowerCase();
      else if (line.trim()) prose.push(line.trim());
    }
  }
  const where = path.basename(file);
  if (!blocks.sql) throw new Error(`${where}: no \`\`\`sql block`);
  if (tab === "chart") {
    if (!blocks.json) throw new Error(`${where}: chart views need a \`\`\`json spec block`);
    JSON.parse(blocks.json);
  }
  const v = { name: name || name0, tab, sql: blocks.sql };
  if (tab === "chart") v.spec = blocks.json;
  if (prose.length) v.desc = prose.join(" ");
  return v;
}

const doc = JSON.parse(fs.readFileSync(src, "utf8"));
const drop = new Set(fs.readFileSync(excludeFile, "utf8").split("\n")
  .map(l => l.trim()).filter(l => l && !l.startsWith("#")));

const names = new Set(doc.views.map(v => v.name));
const unknown = [...drop].filter(n => !names.has(n));
if (unknown.length) {
  console.error(`${excludeFile}: no view named ${unknown.map(n => JSON.stringify(n)).join(", ")}`);
  process.exit(1);
}
doc.views = doc.views.filter(v => !drop.has(v.name));

let added = 0;
if (viewsDir && fs.existsSync(viewsDir)) {
  for (const f of fs.readdirSync(viewsDir).filter(f => f.endsWith(".md")).sort()) {
    const v = parseView(path.join(viewsDir, f));
    if (doc.views.some(x => x.name === v.name)) {
      console.error(`${f}: view name ${JSON.stringify(v.name)} is already taken`);
      process.exit(1);
    }
    doc.views.push(v);
    added++;
  }
}

fs.writeFileSync(out, JSON.stringify(doc, null, 1) + "\n");
console.log(`${out}: ${doc.views.length} views (${drop.size} excluded, ${added} site views)`);
