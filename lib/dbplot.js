// Build-time plots from a published SQLite export (see _data/datasets.json).
//
// A plot is a SQL query plus a Vega-Lite spec, the same pair the data viewer
// edits. At build time the query runs against the export with sql.js and the
// result rows are inlined into the spec as data.values. The page gets:
//   - a static SVG rendered here, so the figure shows without JavaScript and
//     in the feed;
//   - the full spec as JSON, which /assets/js/dbplot.js hands to vega-embed
//     so readers get the live chart (tooltips, selections);
//   - a link into the viewer that opens the same SQL and spec for editing.
//
// The link uses the viewer's own hash formats: #t=chart&n=<view> for an
// unedited view, #t=chart&z=<deflate-raw of sql NUL spec> for custom code.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Read the site data files fresh on every build. A require()d copy is shared
// with Eleventy's data cascade and goes stale under `eleventy --serve`.
const readData = name =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "_data", name), "utf8"));

// A result this large makes the page heavy; warn but still build.
const ROW_WARN = 5000;

let SQL = null;
const dbCache = new Map();     // path -> { mtime, db }
const viewCache = new Map();   // path -> { mtime, views }

function dataset(key) {
  const datasets = readData("datasets.json");
  const name = key || Object.keys(datasets)[0];
  const ds = datasets[name];
  if (!ds) throw new Error(`dbplot: unknown dataset "${name}" (see _data/datasets.json)`);
  return { name, ...ds };
}

async function openDb(ds) {
  const file = path.join(ds.dir, ds.db);
  if (!fs.existsSync(file)) {
    throw new Error(`dbplot: no database at ${file} for dataset "${ds.name}"`);
  }
  const mtime = fs.statSync(file).mtimeMs;
  const hit = dbCache.get(file);
  if (hit && hit.mtime === mtime) return hit.db;
  if (!SQL) SQL = await require("sql.js")();
  if (hit) hit.db.close();
  const db = new SQL.Database(fs.readFileSync(file));
  dbCache.set(file, { mtime, db });
  return db;
}

function loadViews(ds) {
  const file = path.join(ds.dir, ds.views);
  if (!fs.existsSync(file)) {
    throw new Error(`dbplot: no views file at ${file} for dataset "${ds.name}"`);
  }
  const mtime = fs.statSync(file).mtimeMs;
  const hit = viewCache.get(file);
  if (hit && hit.mtime === mtime) return hit.views;
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  const views = Array.isArray(doc) ? doc : doc.views;
  viewCache.set(file, { mtime, views });
  return views;
}

// Site defaults sit under the spec's own config. Same merge as the viewer
// (assets/js/dbviewer.js), so a plot looks the same in both.
function mergeConfig(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) &&
             base[k] && typeof base[k] === "object"
      ? mergeConfig(base[k], v) : v;
  }
  return out;
}

function query(db, sql, label) {
  let out;
  try {
    out = db.exec(sql);
  } catch (e) {
    throw new Error(`dbplot ${label}: SQL failed: ${e.message}`);
  }
  if (!out.length) return [];
  const { columns, values } = out[out.length - 1];
  return values.map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
}

const b64url = buf => buf.toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function viewerLink(ds, { name, sql, spec }) {
  const hash = name
    ? "#t=chart&n=" + encodeURIComponent(name)
    : "#t=chart&z=" + b64url(zlib.deflateRawSync(Buffer.from(sql + "\u0000" + spec)));
  return ds.url + hash;
}

const escapeHtml = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// JSON inside <script type="application/json">: only "</" can end it early.
const scriptJson = obj => JSON.stringify(obj).replace(/</g, "\\u003c");

async function render(ds, { name, sql, spec, caption }) {
  const label = name ? `"${name}"` : "(custom)";
  let parsed;
  try {
    parsed = JSON.parse(spec);
  } catch (e) {
    throw new Error(`dbplot ${label}: spec is not valid JSON: ${e.message}`);
  }
  const rows = query(await openDb(ds), sql, label);
  if (rows.length > ROW_WARN) {
    console.warn(`[dbplot] ${label}: ${rows.length} rows inlined into the page`);
  }

  // The spec's own config wins, except the font: plots use the site's.
  const siteConfig = readData("vegaConfig.json");
  const config = mergeConfig(siteConfig, parsed.config);
  if (siteConfig.font) config.font = siteConfig.font;
  const full = { ...parsed, data: { values: rows }, config };
  const vega = await import("vega");
  const vl = await import("vega-lite");
  let svg = "";
  if (rows.length) {
    // Compile a copy: vl.compile edits the config it is given (it can drop
    // autosize), and `full` is what the page's live chart is built from.
    const view = new vega.View(vega.parse(vl.compile(structuredClone(full)).spec), { renderer: "none" });
    svg = await view.toSVG();
    view.finalize();
  }

  const body = rows.length ? svg : `<p class="dbplot-empty">query returned no rows</p>`;
  const link = `<a href="${escapeHtml(viewerLink(ds, { name, sql, spec }))}">open in data viewer</a>`;
  const cap = caption ? `${caption} &middot; ${link}` : link;
  // One line, no blank lines: markdown must see a single HTML block.
  return `<figure class="dbplot"><div class="dbplot-chart">${body}</div>` +
    (rows.length ? `<script type="application/json" class="dbplot-spec">${scriptJson(full)}</script>` : "") +
    `<figcaption>${cap}</figcaption></figure>` +
    `<script src="/assets/js/dbplot.js" defer></script>`;
}

// {% dbplot "view name" %}  or  {% dbplot "view name", "Caption", "dataset" %}
async function fromView(name, caption, datasetKey) {
  const ds = dataset(datasetKey);
  const v = loadViews(ds).find(v => v.name === name);
  if (!v) throw new Error(`dbplot: no view named "${name}" in ${path.join(ds.dir, ds.views)}`);
  if (v.tab !== "chart") throw new Error(`dbplot: view "${name}" is a table view, not a chart`);
  return render(ds, { name, sql: v.sql, spec: v.spec, caption });
}

// {% dbplotcustom "Caption" %} ```sql ...``` ```json ...``` {% enddbplotcustom %}
// Same two fenced blocks as a view's markdown file.
async function fromBlocks(content, caption, datasetKey) {
  const ds = dataset(datasetKey);
  const block = lang => {
    const m = content.match(new RegExp("```" + lang + "\\s*\\n([\\s\\S]*?)\\n```"));
    return m ? m[1].trim() : null;
  };
  const sql = block("sql");
  const spec = block("json");
  if (!sql || !spec) throw new Error("dbplotcustom: needs a ```sql block and a ```json block");
  return render(ds, { sql, spec, caption });
}

module.exports = { fromView, fromBlocks };
