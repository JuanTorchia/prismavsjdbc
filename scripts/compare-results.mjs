import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (key.startsWith("--")) {
    args.set(key.slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const inputPath = args.get("input") ?? "results/raw/latest.json";
const csvPath = args.get("csv") ?? "results/comparison.csv";
const markdownPath = args.get("markdown") ?? "results/comparison.md";
const lang = (args.get("lang") ?? process.env.LAB_LANG ?? "es").toLowerCase();

const text = {
  es: {
    title: "Resultados comparativos",
    generated: "Generado",
    environment: "Entorno",
    methodology: "Metodologia",
    mode: "Modo",
    runs: "Corridas por escenario",
    requests: "Requests medidos por corrida",
    warmup: "Warmup por corrida",
    concurrency: "Concurrencia del runner",
    warning: "Advertencia: estos numeros observan dos implementaciones concretas contra un dataset comun en esta maquina. No prueban que un lenguaje, VM u ORM sea universalmente mas rapido.",
    observed: "Resultado observado",
    interpretation: "Interpretacion",
    cannot: "Que NO se puede concluir",
    raw: "Datos crudos",
    bullets: [
      "La comparacion mas defendible es naive vs optimized dentro de cada stack, especialmente en relation-summary y n-plus-one-trap.",
      "report-aggregation mide el valor de SQL explicito cuando el shape del dato es agregacional.",
      "transaction-write observa costo de transaccion HTTP + driver + pool + escritura; no aisla solo el motor de base de datos."
    ],
    cannotBullets: [
      "No se puede afirmar que Prisma, JDBC, Node o Java sean siempre mas rapidos o mas lentos.",
      "No se puede extrapolar throughput absoluto a produccion sin controlar CPU, red, pool sizing, GC, indices, plan cache y carga mixta.",
      "RSS es aproximado; en Java se reporta heap+non-heap desde la JVM si no hay medicion nativa de proceso."
    ],
    rawLine: "Ver `results/comparison.csv` y `results/raw/latest.json`."
  },
  en: {
    title: "Comparative Results",
    generated: "Generated",
    environment: "Environment",
    methodology: "Methodology",
    mode: "Mode",
    runs: "Runs per scenario",
    requests: "Measured requests per run",
    warmup: "Warmup requests per run",
    concurrency: "Runner concurrency",
    warning: "Warning: these numbers observe two concrete implementations against a shared dataset on this machine. They do not prove that a language, VM, or ORM is universally faster.",
    observed: "Observed Result",
    interpretation: "Interpretation",
    cannot: "What You Cannot Conclude",
    raw: "Raw Data",
    bullets: [
      "The most defensible comparison is naive vs optimized within each stack, especially in relation-summary and n-plus-one-trap.",
      "report-aggregation measures the value of explicit SQL when the data shape is aggregational.",
      "transaction-write observes the cost of HTTP + driver + pool + write transaction; it does not isolate the database engine alone."
    ],
    cannotBullets: [
      "You cannot claim Prisma, JDBC, Node, or Java are always faster or slower.",
      "You cannot extrapolate absolute throughput to production without controlling CPU, network, pool sizing, GC, indexes, plan cache, and mixed load.",
      "RSS is approximate; Java reports heap + non-heap from the JVM when native process RSS is unavailable."
    ],
    rawLine: "See `results/comparison.csv` and `results/raw/latest.json`."
  }
}[lang] ?? undefined;

if (!text) {
  throw new Error(`Unsupported lang: ${lang}`);
}

const data = JSON.parse(await readFile(inputPath, "utf8"));
const rows = data.rows ?? [];
if (rows.length === 0) {
  throw new Error(`${inputPath} does not contain rows`);
}

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

const headers = Object.keys(rows[0]);
const csv = [
  headers.map(csvEscape).join(","),
  ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))
].join("\n");

function average(items, key) {
  return items.reduce((sum, item) => sum + Number(item[key] ?? 0), 0) / items.length;
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

const groups = new Map();
for (const row of rows) {
  const key = `${row.stack}::${row.scenario}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const summary = [...groups.values()]
  .map((items) => ({
    stack: items[0].stack,
    scenario: items[0].scenario,
    runs: items.length,
    successful_rps_avg: round(average(items, "successful_requests_per_second")),
    successful_p95_ms_avg: round(average(items, "successful_p95_ms")),
    successful_p99_ms_avg: round(average(items, "successful_p99_ms")),
    avg_sql_queries_per_request: round(average(items, "avg_sql_queries_per_successful_request")),
    app_rss_mb_last: items.at(-1).app_rss_mb,
    db_connections_used_last: items.at(-1).db_connections_used
  }))
  .sort((a, b) => a.scenario.localeCompare(b.scenario) || a.stack.localeCompare(b.stack));

const lines = [];
lines.push(`# ${text.title}`, "");
lines.push(`${text.generated}: ${data.generated_at}`, "");
lines.push(`## ${text.environment}`, "");
lines.push(`- OS: ${data.environment.os}`);
lines.push(`- CPU: ${data.environment.cpu} (${data.environment.cpu_count} logical CPUs)`);
lines.push(`- Node: ${data.environment.node}`);
lines.push(`- Java: ${data.environment.java}`);
lines.push(`- Docker: ${data.environment.docker}`, "");
lines.push(`## ${text.methodology}`, "");
lines.push(`- ${text.mode}: ${data.methodology.mode}`);
lines.push(`- ${text.runs}: ${data.methodology.runs}`);
lines.push(`- ${text.requests}: ${data.methodology.requests}`);
lines.push(`- ${text.warmup}: ${data.methodology.warmup}`);
lines.push(`- ${text.concurrency}: ${data.methodology.concurrency}`, "");
lines.push(text.warning, "");
lines.push(`## ${text.observed}`, "");
lines.push("| scenario | stack | runs | rps ok avg | p95 ok ms avg | p99 ok ms avg | SQL/request avg | RSS MB last | DB conns last |");
lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
for (const row of summary) {
  lines.push(`| ${row.scenario} | ${row.stack} | ${row.runs} | ${row.successful_rps_avg} | ${row.successful_p95_ms_avg} | ${row.successful_p99_ms_avg} | ${row.avg_sql_queries_per_request} | ${row.app_rss_mb_last} | ${row.db_connections_used_last} |`);
}
lines.push("", `## ${text.interpretation}`, "");
for (const bullet of text.bullets) lines.push(`- ${bullet}`);
lines.push("", `## ${text.cannot}`, "");
for (const bullet of text.cannotBullets) lines.push(`- ${bullet}`);
lines.push("", `## ${text.raw}`, "", text.rawLine, "");

await mkdir(path.dirname(csvPath), { recursive: true });
await mkdir(path.dirname(markdownPath), { recursive: true });
await writeFile(csvPath, `${csv}\n`, "utf8");
await writeFile(markdownPath, lines.join("\n"), "utf8");
console.log(`Wrote ${csvPath} and ${markdownPath}`);
