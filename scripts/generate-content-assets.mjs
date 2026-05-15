import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const comparisonPath = args.get("comparison") ?? "results/comparison.csv";
const javaPath = args.get("java") ?? "results/matrix/java-25-editorial-comparison.csv";
const outDir = args.get("out") ?? "results/assets";
const lang = (args.get("lang") ?? process.env.LAB_LANG ?? "es").toLowerCase();

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = splitCsv(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = splitCsv(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function splitCsv(line) {
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
  return values;
}

function num(value) {
  return Number(String(value ?? "0").replace(",", "."));
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

function groupSummary(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.stack}::${row.scenario}::${row.level ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map((items) => ({
    stack: items[0].stack,
    scenario: items[0].scenario,
    level: items[0].level ?? "",
    p95: round(items.reduce((sum, row) => sum + num(row.successful_p95_ms), 0) / items.length),
    p99: round(items.reduce((sum, row) => sum + num(row.successful_p99_ms), 0) / items.length),
    rps: round(items.reduce((sum, row) => sum + num(row.successful_requests_per_second), 0) / items.length),
    sql: round(items.reduce((sum, row) => sum + num(row.avg_sql_queries_per_successful_request), 0) / items.length),
    errorRate: round(items.reduce((sum, row) => sum + num(row.error_rate), 0) / items.length)
  }));
}

const copy = {
  es: {
    title: "Prisma vs JDBC: evidencia visual",
    subtitle: "Graficos generados desde resultados reproducibles. No son verdad universal: muestran esta maquina, este dataset y esta metodologia.",
    p95: "p95 exitoso por escenario",
    sql: "SQL por request exitoso",
    n1: "Impacto N+1: naive vs idiomatic/best-effort",
    level: "Mejora por nivel dentro de cada stack",
    best: "Idiomatic vs best-effort",
    table: "Resumen editorial",
    caption: "El patron importante es que optimizar el shape cambia mas que discutir el runtime en abstracto.",
    warning: "Advertencia metodologica: HTTP, pool, driver, GC, Docker Desktop y PostgreSQL estan dentro de la medicion.",
    scenario: "escenario",
    stack: "stack",
    metric: "metrica"
  },
  en: {
    title: "Prisma vs JDBC: visual evidence",
    subtitle: "Charts generated from reproducible results. They are not universal truth: they show this machine, dataset, and methodology.",
    p95: "Successful p95 by scenario",
    sql: "SQL per successful request",
    n1: "N+1 impact: naive vs idiomatic/best-effort",
    level: "Improvement by level within each stack",
    best: "Idiomatic vs best-effort",
    table: "Editorial summary",
    caption: "The important pattern is that optimizing query shape changes more than arguing about runtime in the abstract.",
    warning: "Methodology warning: HTTP, pool, driver, GC, Docker Desktop, and PostgreSQL are all inside the measurement.",
    scenario: "scenario",
    stack: "stack",
    metric: "metric"
  }
}[lang] ?? undefined;

if (!copy) throw new Error(`Unsupported lang: ${lang}`);

function barChart({ title, rows, valueKey, fileName, width = 1600, height = 860, maxItems = 24 }) {
  const data = rows
    .slice()
    .sort((a, b) => a.scenario.localeCompare(b.scenario) || a.stack.localeCompare(b.stack))
    .slice(0, maxItems);
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const margin = { top: 78, right: 52, bottom: 250, left: 88 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barW = innerW / data.length - 8;
  const colors = { prisma: "#2563eb", jdbc: "#16a34a" };
  const bars = data.map((d, i) => {
    const x = margin.left + i * (innerW / data.length) + 4;
    const h = (d[valueKey] / max) * innerH;
    const y = margin.top + innerH - h;
    const label = `${d.scenario.replace("-best-effort", "-best").replace("-idiomatic", "-idio").replace("-optimized", "-opt").replace("-naive", "-naive")} / ${d.stack}`;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${colors[d.stack] ?? "#64748b"}" />
      <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="12" fill="#0f172a">${d[valueKey]}</text>
      <text x="${x + barW / 2}" y="${height - 222}" text-anchor="end" transform="rotate(-52 ${x + barW / 2} ${height - 222})" font-size="13" fill="#334155">${escapeXml(label)}</text>`;
  }).join("");
  return svgFrame({ title, width, height, body: `
    <line x1="${margin.left}" y1="${margin.top + innerH}" x2="${width - margin.right}" y2="${margin.top + innerH}" stroke="#94a3b8" />
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + innerH}" stroke="#94a3b8" />
    ${bars}
    <circle cx="${width - 230}" cy="38" r="7" fill="#2563eb"/><text x="${width - 216}" y="42" font-size="13">Prisma</text>
    <circle cx="${width - 140}" cy="38" r="7" fill="#16a34a"/><text x="${width - 126}" y="42" font-size="13">JDBC</text>
  `, fileName });
}

function nPlusOneChart(rows) {
  const wanted = rows.filter((r) => ["relation-summary-naive", "relation-summary-best-effort", "n-plus-one-trap-naive", "n-plus-one-trap-idiomatic", "n-plus-one-trap-best-effort"].includes(r.scenario));
  return barChart({ title: copy.n1, rows: wanted, valueKey: "sql", fileName: "n-plus-one-impact.svg", height: 760, maxItems: 10 });
}

function levelImprovementChart(rows) {
  const bases = rows.filter((r) => r.level === "naive");
  const improved = [];
  for (const base of bases) {
    const prefix = base.scenario.replace("-naive", "");
    const peers = rows.filter((r) => r.stack === base.stack && r.scenario.startsWith(prefix) && r.scenario !== base.scenario && ["idiomatic", "best-effort"].includes(r.level));
    for (const peer of peers) {
      improved.push({
        stack: peer.stack,
        scenario: `${prefix}-${peer.level}`,
        level: peer.level,
        p95: round(base.p95 / Math.max(peer.p95, 0.01)),
        sql: round(base.sql / Math.max(peer.sql, 0.01))
      });
    }
  }
  return barChart({ title: copy.level, rows: improved, valueKey: "sql", fileName: "level-improvement.svg", height: 720, maxItems: 8 });
}

function idiomaticVsBestChart(rows) {
  const wanted = rows.filter((r) => ["read-by-id", "read-by-id-best-effort", "n-plus-one-trap-idiomatic", "n-plus-one-trap-best-effort"].includes(r.scenario));
  return barChart({ title: copy.best, rows: wanted, valueKey: "p95", fileName: "idiomatic-vs-best-effort.svg", height: 760, maxItems: 8 });
}

function svgFrame({ title, width, height, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="40" y="44" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  <text x="40" y="${height - 32}" font-family="Arial, sans-serif" font-size="13" fill="#475569">${escapeXml(copy.warning)}</text>
  <g font-family="Arial, sans-serif">${body}</g>
</svg>`;
}

function escapeXml(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function htmlReport(summary) {
  const rows = summary
    .slice()
    .sort((a, b) => a.scenario.localeCompare(b.scenario) || a.stack.localeCompare(b.stack))
    .map((r) => `<tr><td>${r.scenario}</td><td>${r.level}</td><td>${r.stack}</td><td>${r.p95}</td><td>${r.rps}</td><td>${r.sql}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${copy.title}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    header { padding: 48px 56px 24px; background: #0f172a; color: white; }
    h1 { margin: 0 0 12px; font-size: 42px; letter-spacing: 0; }
    header p { max-width: 880px; margin: 0; color: #cbd5e1; font-size: 18px; line-height: 1.5; }
    main { padding: 32px 56px 56px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 28px; max-width: 1280px; margin: 0 auto; }
    section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; box-shadow: 0 1px 2px rgba(15, 23, 42, .06); }
    h2 { margin: 0 0 16px; font-size: 24px; }
    img { width: 100%; height: auto; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; }
    .note { color: #475569; line-height: 1.5; }
  </style>
</head>
<body>
  <header>
    <h1>${copy.title}</h1>
    <p>${copy.subtitle}</p>
  </header>
  <main>
    <div class="grid">
      <section id="p95"><h2>${copy.p95}</h2><img src="p95-by-scenario.svg" alt="${copy.p95}" /></section>
      <section id="sql"><h2>${copy.sql}</h2><img src="sql-by-scenario.svg" alt="${copy.sql}" /></section>
      <section id="n1"><h2>${copy.n1}</h2><img src="n-plus-one-impact.svg" alt="${copy.n1}" /></section>
      <section id="levels"><h2>${copy.level}</h2><img src="level-improvement.svg" alt="${copy.level}" /></section>
      <section id="best"><h2>${copy.best}</h2><img src="idiomatic-vs-best-effort.svg" alt="${copy.best}" /></section>
      <section id="summary">
        <h2>${copy.table}</h2>
        <p class="note">${copy.caption}</p>
        <table><thead><tr><th>scenario</th><th>level</th><th>stack</th><th>p95 ms</th><th>rps</th><th>SQL/request</th></tr></thead><tbody>${rows}</tbody></table>
      </section>
    </div>
  </main>
</body>
</html>`;
}

await mkdir(outDir, { recursive: true });
const comparison = parseCsv(await readFile(comparisonPath, "utf8"));
const summary = groupSummary(comparison);

await writeFile(path.join(outDir, "p95-by-scenario.svg"), barChart({ title: copy.p95, rows: summary, valueKey: "p95", fileName: "p95-by-scenario.svg" }), "utf8");
await writeFile(path.join(outDir, "sql-by-scenario.svg"), barChart({ title: copy.sql, rows: summary, valueKey: "sql", fileName: "sql-by-scenario.svg" }), "utf8");
await writeFile(path.join(outDir, "n-plus-one-impact.svg"), nPlusOneChart(summary), "utf8");
await writeFile(path.join(outDir, "level-improvement.svg"), levelImprovementChart(summary), "utf8");
await writeFile(path.join(outDir, "idiomatic-vs-best-effort.svg"), idiomaticVsBestChart(summary), "utf8");
await writeFile(path.join(outDir, `report.${lang}.html`), htmlReport(summary), "utf8");

try {
  const javaRows = parseCsv(await readFile(javaPath, "utf8"));
  const javaSummary = groupSummary(javaRows).filter((r) => r.stack === "jdbc");
  await writeFile(path.join(outDir, "java-sensitivity-p95.svg"), barChart({ title: "Java sensitivity p95 / Sensibilidad Java p95", rows: javaSummary, valueKey: "p95", fileName: "java-sensitivity-p95.svg" }), "utf8");
} catch {
  // Optional matrix asset.
}

console.log(`Wrote content assets to ${outDir}`);
