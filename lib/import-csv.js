// Load CSV files into a SQLite database as tables, one table per file
// (named after the file, without .csv). Existing tables of that name are
// replaced. Columns whose every non-empty value is a number are typed REAL
// (INTEGER when all are whole), so charts get numbers, not strings.
//   node lib/import-csv.js <db.sqlite> <file.csv>...
// Used by `make extra-tpch` for figure data that is not part of the corpus.
const fs = require("fs");
const path = require("path");

// RFC 4180-ish: quoted fields, doubled quotes, commas and newlines in quotes.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const isNum = s => s.trim() !== "" && Number.isFinite(Number(s));
const quote = s => '"' + s.replace(/"/g, '""') + '"';

(async () => {
  const [dbFile, ...csvs] = process.argv.slice(2);
  if (!dbFile || !csvs.length) {
    console.error("usage: node lib/import-csv.js <db.sqlite> <file.csv>...");
    process.exit(2);
  }
  const SQL = await require("sql.js")();
  const db = new SQL.Database(fs.readFileSync(dbFile));
  for (const file of csvs) {
    const [header, ...rows] = parseCsv(fs.readFileSync(file, "utf8"));
    const table = path.basename(file, ".csv");
    const types = header.map((_, i) => {
      const vals = rows.map(r => r[i] ?? "").filter(v => v !== "");
      if (!vals.length || !vals.every(isNum)) return "TEXT";
      return vals.every(v => Number.isInteger(Number(v))) ? "INTEGER" : "REAL";
    });
    db.run(`DROP TABLE IF EXISTS ${quote(table)}`);
    db.run(`CREATE TABLE ${quote(table)} (${header.map((h, i) => `${quote(h)} ${types[i]}`).join(", ")})`);
    const ins = db.prepare(`INSERT INTO ${quote(table)} VALUES (${header.map(() => "?").join(", ")})`);
    for (const r of rows) {
      ins.run(header.map((_, i) => {
        const v = r[i] ?? "";
        if (v === "") return null;
        return types[i] === "TEXT" ? v : Number(v);
      }));
    }
    ins.free();
    console.log(`${table}: ${rows.length} rows (${header.map((h, i) => `${h} ${types[i]}`).join(", ")})`);
  }
  fs.writeFileSync(dbFile, Buffer.from(db.export()));
})();
