// SQL + Vega-Lite viewer. Adapted from Thunderous-Pupil's web/index.html;
// the page markup is _includes/layouts/dbviewer.njk, which names the
// database, views file and sql.js wasm in data-* attributes on .dbv.
// Override the database with #db=name in the URL.
const PAGE = document.querySelector(".dbv").dataset;
const DB_CANDIDATES = [PAGE.db];
// Site chart defaults (_data/vegaConfig.json), under each spec's own config.
const SITE_CONFIG = window.SITE_VEGA_CONFIG || {};

// Views are NOT defined here. They are built from web/views/*.md by
// bin/build-views into views.json, which is fetched at startup. Adding or
// editing a view means editing markdown and rebuilding, never touching this
// file.
let TABLE_VIEWS = {};      // name -> sql
let CHART_VIEWS = {};      // name -> {sql, spec, desc?}
let TABLE_DESC  = {};      // name -> tooltip
let VIEWS_URL   = PAGE.views;

async function loadViews() {
  const res = await fetch(VIEWS_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${VIEWS_URL}: ${res.status} ${res.statusText}`);
  const doc = await res.json();
  const list = Array.isArray(doc) ? doc : doc.views;
  if (!Array.isArray(list)) throw new Error(`${VIEWS_URL}: no "views" array`);
  for (const v of list) {
    if (!v || !v.name || !v.sql) continue;
    if (v.tab === "chart") CHART_VIEWS[v.name] = { sql: v.sql, spec: v.spec || "{}", desc: v.desc || "" };
    else { TABLE_VIEWS[v.name] = v.sql; if (v.desc) TABLE_DESC[v.name] = v.desc; }
  }
  return list.length;
}
const $ = id => document.getElementById(id);
const status = $("status"), meta = $("meta"), specerr = $("specerr");
let db = null, cols = [], rows = [], sortCol = null, sortDir = 1, tab = "table";

function readHash() {
  const out = {};
  for (const part of location.hash.replace(/^#/, "").split("&")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    try { out[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1)); } catch {}
  }
  return out;
}
const h0 = readHash();

// ---- link shortening -----------------------------------------------------
// Three tiers, shortest that applies:
//   #t=chart&n=<view>              an unmodified preset -- just its name
//   #t=chart&n=<view>&zq=<blob>    SQL edited, spec still the preset's
//   #t=chart&z=<blob>              both edited
// Plain &q=/&v= are still read, so older links keep working and the hash
// stays hand-editable.
//
// Compression is the browser's own deflate-raw via CompressionStream, so
// there is nothing extra to vendor. Where it is missing (pre-2023 browsers)
// we fall back to the plain encoding -- longer, but never broken.
const HAS_CS = typeof CompressionStream !== "undefined";

const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: s => Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0)),
};

async function deflate(str) {
  const cs = new CompressionStream("deflate-raw");
  const w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(str)); w.close();
  return b64u.enc(await new Response(cs.readable).arrayBuffer());
}
async function inflate(blob) {
  const ds = new DecompressionStream("deflate-raw");
  const w = ds.writable.getWriter();
  w.write(b64u.dec(blob)); w.close();
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}

// Which preset, if any, the editors currently hold.
function matchPreset() {
  const set = tab === "chart" ? CHART_VIEWS : TABLE_VIEWS;
  const sql = $("sql").value, spec = $("spec").value;
  for (const [name, d] of Object.entries(set)) {
    const psql = tab === "chart" ? d.sql : d;
    if (psql === sql) {
      return { name, sql: true, spec: tab !== "chart" || d.spec === spec };
    }
  }
  if (tab === "chart") {                 // SQL edited but spec untouched
    for (const [name, d] of Object.entries(CHART_VIEWS))
      if (d.spec === spec) return { name, sql: false, spec: true };
  }
  return null;
}

const SEP = "\u0000";

async function shareHash() {
  const base = "#t=" + tab;
  const m = matchPreset();
  if (m && m.sql && m.spec) return base + "&n=" + encodeURIComponent(m.name);
  if (HAS_CS) {
    if (m && m.spec)                     // spec comes from the preset
      return base + "&n=" + encodeURIComponent(m.name)
                  + "&zq=" + await deflate($("sql").value);
    const payload = tab === "chart"
      ? $("sql").value + SEP + $("spec").value : $("sql").value;
    return base + "&z=" + await deflate(payload);
  }
  let u = base + "&q=" + encodeURIComponent($("sql").value);
  if (tab === "chart") u += "&v=" + encodeURIComponent($("spec").value);
  return u;
}

async function shareURL() {
  return location.origin + location.pathname + await shareHash();
}

// Fire-and-forget; the sequence guard stops a slow compress from overwriting
// the hash of a newer edit.
let hashSeq = 0;
async function syncHash() {
  const mine = ++hashSeq;
  try {
    const hash = await shareHash();
    if (mine === hashSeq) history.replaceState(null, "", hash);
  } catch {}
}

// Resolve an incoming hash into the editors. Returns false if it said nothing.
async function applyHash(hh) {
  const set = hh.t === "chart" ? CHART_VIEWS : TABLE_VIEWS;
  let sql = null, spec = null;
  if (hh.n && set[hh.n]) {
    const d = set[hh.n];
    sql  = hh.t === "chart" ? d.sql : d;
    if (hh.t === "chart") spec = d.spec;
  }
  try {
    if (hh.z)  { const parts = (await inflate(hh.z)).split(SEP);
                 sql = parts[0]; if (parts.length > 1) spec = parts[1]; }
    if (hh.zq) { sql = await inflate(hh.zq); }
  } catch (e) {
    fail("could not decode the link: " + (e.message || e));
    return false;
  }
  if (hh.q) sql = hh.q;                  // plain forms still win if present
  if (hh.v && hh.t === "chart") spec = hh.v;
  if (sql === null && spec === null) return false;
  if (sql  !== null) $("sql").value  = sql;
  if (spec !== null) $("spec").value = spec;
  return true;
}

// The two tabs carry independent view sets: table views are SQL only, chart
// views pair SQL with a spec. Switching rebuilds the button row.
function buildViewButtons() {
  const host = $("views");
  host.innerHTML = "";
  const set = tab === "chart" ? CHART_VIEWS : TABLE_VIEWS;
  $("viewLabel").textContent = tab === "chart" ? "chart views" : "table views";
  for (const name of Object.keys(set)) {
    const b = document.createElement("button");
    b.textContent = name;
    // Prose from the view's markdown file, if any.
    const d = tab === "chart" ? (set[name].desc || "") : (TABLE_DESC[name] || "");
    if (d) b.title = d;
    b.onclick = () => {
      if (tab === "chart") {
        $("sql").value = set[name].sql;
        $("spec").value = set[name].spec;
      } else {
        $("sql").value = set[name];
      }
      run();
    };
    host.appendChild(b);
  }
}

function setTab(t, keepSql) {
  tab = t;
  $("tabTable").classList.toggle("on", t === "table");
  $("tabChart").classList.toggle("on", t === "chart");
  $("paneTable").classList.toggle("hide", t !== "table");
  $("paneChart").classList.toggle("hide", t !== "chart");
  $("svg").classList.toggle("hide", t !== "chart");
  $("jpeg").classList.toggle("hide", t !== "chart");
  applyLayout();
  buildViewButtons();
  if (!keepSql) {
    // Switching tabs lands on that tab's first view, when there is one.
    if (loadFirstView() && db) run();
  } else if (t === "chart") { draw(); }
  syncHash();
}
$("tabTable").onclick = () => setTab("table");
$("tabChart").onclick = () => setTab("chart");

// Initial state: hash wins, else the first view of the chosen tab.
tab = h0.t === "chart" ? "chart" : "table";
// Editor defaults are filled once views.json has loaded.
function loadFirstView() {
  const set = tab === "chart" ? CHART_VIEWS : TABLE_VIEWS;
  const first = Object.keys(set)[0];
  if (first === undefined) return false;
  $("sql").value = tab === "chart" ? set[first].sql : set[first];
  const c0 = Object.keys(CHART_VIEWS)[0];
  if (c0) $("spec").value = CHART_VIEWS[c0].spec;
  return true;
}

function fail(msg) { status.textContent = msg; status.className = "err"; }

(async () => {
  try {
    const SQL = await initSqlJs({ locateFile: () => PAGE.wasm });
    if (h0.views) VIEWS_URL = h0.views;
    const names = h0.db ? [h0.db, ...DB_CANDIDATES] : DB_CANDIDATES;
    let res = null; const tried = [];
    for (const n of names) {
      const r = await fetch(n, { cache: "no-cache" });
      if (r.ok) { res = r; break; }
      tried.push(`${n} (${r.status})`);
    }
    if (!res) throw new Error("no database found: tried " + tried.join(", "));
    const buf = await res.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buf));
    // Run count when the database has a run table (the TPC-H corpus does).
    let n = null;
    try { n = db.exec("SELECT COUNT(*) FROM run")[0]?.values[0][0] ?? 0; } catch {}
    const when = res.headers.get("last-modified");
    status.textContent = (n === null ? "" : `${n.toLocaleString()} runs \u00b7 `)
      + `${(buf.byteLength/1048576).toFixed(1)} MB`
      + (when ? ` \u00b7 published ${when}` : "");
    $("run").disabled = $("csv").disabled = $("link").disabled = $("svg").disabled = $("jpeg").disabled = false;

    // Views come from views.json. A missing file is not fatal: the SQL box
    // still works, there are simply no buttons.
    let nviews = 0;
    try {
      nviews = await loadViews();
    } catch (e) {
      status.textContent += " \u00b7 no views (" + (e.message || e) + ")";
    }
    buildViewButtons();
    loadFirstView();

    // After the views exist, so a #n=<view> link can resolve. Decoding a
    // compressed hash is async, hence here rather than at parse time.
    await applyHash(h0);
    setTab(tab, true);
    run();
  } catch (e) { fail("could not load database: " + e.message); }
})();

function run() {
  if (!db) return;
  const t0 = performance.now();
  try {
    const out = db.exec($("sql").value);
    if (!out.length) {
      cols = []; rows = [];
      meta.textContent = "no rows";
      render(); if (tab === "chart") draw();
      return;
    }
    cols = out[0].columns; rows = out[0].values; sortCol = null;
    meta.textContent = `${rows.length.toLocaleString()} rows \u00b7 ${(performance.now()-t0).toFixed(0)} ms`;
    status.className = "";
    render();
    if (tab === "chart") draw();
    syncHash();
  } catch (e) { meta.textContent = ""; fail("SQL error: " + e.message); }
}

function records() {
  return rows.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}

// Site chart defaults go under the spec's own config, as in lib/dbplot.js,
// except the font: charts use the page font whatever their spec says, so every
// view and every export matches the site. Vega measures text when it lays out
// legends and axes, so the font has to be loaded before the first draw.
const fontsReady = Promise.all([
  '400 12px "Atkinson Hyperlegible Next Variable"', '700 12px "Atkinson Hyperlegible Next Variable"'
].map(f => document.fonts.load(f))).catch(() => {});
function mergeConfig(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) &&
             base[k] && typeof base[k] === "object"
      ? mergeConfig(base[k], v) : v;
  }
  return out;
}
function withSiteConfig(spec) {
  spec.config = mergeConfig(SITE_CONFIG, spec.config);
  if (SITE_CONFIG.font) spec.config.font = SITE_CONFIG.font;
  return spec;
}

let chartView = null;
async function draw() {
  if (tab !== "chart") return;
  specerr.textContent = "";
  if (!rows.length) { $("chart").innerHTML = "<div style='color:var(--pico-muted-color)'>query returned no rows</div>"; return; }
  let spec;
  try { spec = JSON.parse($("spec").value); }
  catch (e) { specerr.textContent = "spec is not valid JSON: " + e.message; return; }
  spec.data = { values: records() };
  withSiteConfig(spec);
  await fontsReady;
  try {
    if (chartView) { chartView.finalize(); chartView = null; }
    // Text and axes are currentColor, so the chart follows the site's theme
    // toggle with no Vega theme and no redraw.
    const r = await vegaEmbed("#chart", spec, { actions: false, renderer: "svg" });
    chartView = r.view;
  } catch (e) { specerr.textContent = "Vega-Lite: " + (e.message || e); }
}

// Keep the address bar in step with the editors, not just with the last Run.
// Without this a spec edit redraws the chart but leaves the hash on the old
// preset, so copying the URL silently loses the edit. Debounced, and
// syncHash's sequence guard makes overlapping calls safe.
let specTimer = null, sqlTimer = null;
$("spec").oninput = () => {
  clearTimeout(specTimer);
  specTimer = setTimeout(() => { draw(); syncHash(); }, 400);
};
$("sql").oninput = () => {
  clearTimeout(sqlTimer);
  sqlTimer = setTimeout(syncHash, 400);
};

function render() {
  const idx = sortCol === null ? null : cols.indexOf(sortCol);
  let r = rows;
  if (idx !== null) {
    r = [...rows].sort((a, b) => {
      const x = a[idx], y = b[idx];
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y
              : String(x).localeCompare(String(y))) * sortDir;
    });
  }
  $("head").innerHTML = "<tr>" + cols.map(c =>
    `<th data-c="${c}">${c}${c === sortCol ? (sortDir > 0 ? " \u25b2" : " \u25bc") : ""}</th>`).join("") + "</tr>";
  for (const th of $("head").querySelectorAll("th")) {
    th.onclick = () => {
      const c = th.dataset.c;
      sortDir = (c === sortCol) ? -sortDir : 1;
      sortCol = c; render();
    };
  }
  const shown = r.slice(0, 2000);
  $("body").innerHTML = shown.map(row => "<tr>" + row.map(v =>
    `<td class="${typeof v === "number" ? "num" : ""}">${
      v === null ? "" : String(v).replace(/[&<>]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))
    }</td>`).join("") + "</tr>").join("");
}

$("run").onclick = run;
$("sql").onkeydown = e => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
};
$("spec").onkeydown = e => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); draw(); }
};

async function toClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  return ok;
}

$("link").onclick = async () => {
  const was = meta.textContent;
  const url = await shareURL();
  const hash = url.slice(url.indexOf("#"));
  const how = hash.includes("&n=") && !hash.includes("&zq=") ? "preset"
            : hash.includes("&zq=") ? "preset + edited SQL"
            : hash.includes("&z=")  ? "compressed"
            : "uncompressed";
  const ok = await toClipboard(url);
  meta.textContent = ok ? `link copied \u00b7 ${url.length} chars \u00b7 ${how}`
                        : "could not copy \u2014 the address bar already holds it";
  setTimeout(() => { meta.textContent = was; }, 3000);
};

$("csv").onclick = () => {
  const esc = v => v === null ? "" :
    /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const blob = new Blob([[cols.join(","), ...rows.map(r => r.map(esc).join(","))].join("\n")],
                        { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "corpus_query.csv"; a.click();
  URL.revokeObjectURL(a.href);
};

$("svg").onclick = async () => {
  if (!chartView) return;
  const svg = await chartView.toSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "corpus_figure.svg"; a.click();
  URL.revokeObjectURL(a.href);
};
// JPEG export. JPEG has no transparency, and the on-screen chart has a
// transparent background plus -- in dark mode -- light text that would vanish
// on white. So the export is a fresh render of the same spec in black on a
// white background, not a copy of what is on screen.
// The dropdown positions shown on screen are carried over.
$("jpeg").onclick = async () => {
  if (!chartView) return;
  let spec;
  try { spec = JSON.parse($("spec").value); } catch (e) { return; }
  spec.data = { values: records() };
  withSiteConfig(spec);
  spec.config = JSON.parse(JSON.stringify(spec.config).replace(/"currentColor"/g, '"#000000"'));
  await fontsReady;
  try {
    const vg = vegaLite.compile(spec).spec;
    vg.background = "white";
    const view = new vega.View(vega.parse(vg), { renderer: "none" });
    for (const p of spec.params || []) {
      if (p.select) continue;              // selections are not plain values
      try { view.signal(p.name, chartView.signal(p.name)); } catch (e) {}
    }
    await view.runAsync();
    const canvas = await view.toCanvas(2);  // 2x so text stays sharp
    view.finalize();
    const m = matchPreset();
    const name = (m ? m.name : "corpus_figure").replace(/[^A-Za-z0-9._-]+/g, "_");
    canvas.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name + ".jpg"; a.click();
      URL.revokeObjectURL(a.href);
    }, "image/jpeg", 0.95);
  } catch (e) { specerr.textContent = "JPEG export: " + (e.message || e); }
};
// Chart-tab layout. "beside": spec editor next to the chart (the original).
// "split": SQL and spec share a row, chart full width below. Remembered per
// browser; localStorage can be unavailable (private mode), so it is optional.
const LAYOUTS = { beside: "Layout: spec beside chart", split: "Layout: editors side by side" };
let layout = "beside";
try { if (localStorage.getItem("layout") === "split") layout = "split"; } catch (e) {}
function applyLayout() {
  const split = layout === "split" && tab === "chart";
  document.querySelector(".dbv").classList.toggle("split", split);
  const block = $("specBlock");
  if (split && block.parentElement !== $("editors")) $("editors").appendChild(block);
  if (!split && block.parentElement !== $("paneChart"))
    $("paneChart").insertBefore(block, $("paneChart").firstChild);
  $("layout").textContent = LAYOUTS[layout];
  $("layout").classList.toggle("hide", tab !== "chart");
}
$("layout").onclick = () => {
  layout = layout === "split" ? "beside" : "split";
  try { localStorage.setItem("layout", layout); } catch (e) {}
  applyLayout();
};
applyLayout();
