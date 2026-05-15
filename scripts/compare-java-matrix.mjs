import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const mode = args.get("mode") ?? "editorial";
const outputPath = args.get("output") ?? "results/matrix/java-matrix-summary.md";

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

const candidates = ["java-21", "java-22", "java-25"];
const all = [];
for (const label of candidates) {
  const file = `results/matrix/${label}-${mode}-comparison.csv`;
  if (!(await exists(file))) continue;
  const rows = parseCsv(await readFile(file, "utf8"));
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.stack}::${row.scenario}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const items of groups.values()) {
    all.push({
      java: label,
      stack: items[0].stack,
      scenario: items[0].scenario,
      p95: round(items.reduce((s, r) => s + num(r.successful_p95_ms), 0) / items.length),
      rps: round(items.reduce((s, r) => s + num(r.successful_requests_per_second), 0) / items.length),
      sql: round(items.reduce((s, r) => s + num(r.avg_sql_queries_per_successful_request), 0) / items.length)
    });
  }
}

if (!all.some((row) => row.java === "java-21")) {
  throw new Error(`Missing Java 21 baseline for mode ${mode}`);
}

const baseline = all.filter((row) => row.java === "java-21");
const lines = [
  "# Matriz Java",
  "",
  `Modo: \`${mode}\``,
  "",
  "Interpretacion / Interpretation: sensibilidad de JVM para JDBC. This is runtime sensitivity for JDBC, not the central Prisma vs JDBC claim.",
  "",
  "| java | scenario | p95 ms | delta p95 vs Java 21 % | rps | delta rps vs Java 21 % | SQL/request |",
  "|---|---|---:|---:|---:|---:|---:|"
];

for (const row of all.filter((r) => r.stack === "jdbc").sort((a, b) => a.scenario.localeCompare(b.scenario) || a.java.localeCompare(b.java))) {
  const base = baseline.find((b) => b.stack === row.stack && b.scenario === row.scenario);
  const p95Delta = base?.p95 ? round(((row.p95 - base.p95) / base.p95) * 100) : 0;
  const rpsDelta = base?.rps ? round(((row.rps - base.rps) / base.rps) * 100) : 0;
  lines.push(`| ${row.java} | ${row.scenario} | ${row.p95} | ${p95Delta} | ${row.rps} | ${rpsDelta} | ${row.sql} |`);
}

lines.push("", "## Nota / Note", "", "- ES: usar como sensibilidad metodologica, no como benchmark central.", "- EN: use as methodology sensitivity, not as the central benchmark.");
await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
