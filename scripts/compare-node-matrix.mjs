import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const mode = args.get("mode") ?? "smoke";
const outputPath = args.get("output") ?? "results/matrix/node-matrix-summary.md";
const versions = (process.env.NODE_MATRIX_VERSIONS ?? "20.18.0 22.17.1 24.11.1 25.2.1").split(/\s+/).filter(Boolean);

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (ch === "," && !quoted) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function num(value) {
  return Number(String(value ?? "0").replace(",", "."));
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

const all = [];
for (const version of versions) {
  const label = `node-${version}`;
  const file = `results/matrix/${label}-${mode}-comparison.csv`;
  if (!(await exists(file))) continue;
  const rows = parseCsv(await readFile(file, "utf8")).filter((row) => row.stack === "prisma");
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.scenario)) groups.set(row.scenario, []);
    groups.get(row.scenario).push(row);
  }
  for (const items of groups.values()) {
    all.push({
      node: label,
      scenario: items[0].scenario,
      p95: round(items.reduce((s, r) => s + num(r.successful_p95_ms), 0) / items.length),
      rps: round(items.reduce((s, r) => s + num(r.successful_requests_per_second), 0) / items.length),
      sql: round(items.reduce((s, r) => s + num(r.avg_sql_queries_per_successful_request), 0) / items.length)
    });
  }
}

if (!all.some((row) => row.node === "node-24.11.1")) {
  throw new Error(`Missing Node 24.11.1 baseline for mode ${mode}`);
}

const baseline = all.filter((row) => row.node === "node-24.11.1");
const lines = [
  "# Matriz Node",
  "",
  `Modo: \`${mode}\``,
  "",
  "Interpretacion / Interpretation: sensibilidad del runtime Node para Prisma. Node runtime sensitivity for Prisma; Node 24 LTS is the editorial baseline.",
  "",
  "| node | scenario | p95 ms | delta p95 vs Node 24 % | rps | delta rps vs Node 24 % | SQL/request |",
  "|---|---|---:|---:|---:|---:|---:|"
];

for (const row of all.sort((a, b) => a.scenario.localeCompare(b.scenario) || a.node.localeCompare(b.node))) {
  const base = baseline.find((b) => b.scenario === row.scenario);
  const p95Delta = base?.p95 ? round(((row.p95 - base.p95) / base.p95) * 100) : 0;
  const rpsDelta = base?.rps ? round(((row.rps - base.rps) / base.rps) * 100) : 0;
  lines.push(`| ${row.node} | ${row.scenario} | ${row.p95} | ${p95Delta} | ${row.rps} | ${rpsDelta} | ${row.sql} |`);
}

lines.push("", "## Nota / Note", "", "- ES: Node 25 es Current/no-LTS; no usar como baseline sin aclararlo.", "- EN: Node 25 is Current/non-LTS; do not use it as a baseline without saying so.");
await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
