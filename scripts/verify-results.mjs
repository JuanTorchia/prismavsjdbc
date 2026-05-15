import { readFile } from "node:fs/promises";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const input = args.get("input") ?? "results/raw/latest.json";
const requireEditorial = args.get("require-editorial") === "true";
const data = JSON.parse(await readFile(input, "utf8"));
const rows = data.rows ?? [];

const expectedRanges = {
  "prisma::read-by-id": [3.5, 4.5],
  "prisma::read-by-id-best-effort": [0.8, 1.5],
  "jdbc::read-by-id": [0.8, 1.2],
  "jdbc::read-by-id-best-effort": [0.8, 1.2],
  "prisma::paginated-list": [0.8, 1.2],
  "jdbc::paginated-list": [0.8, 1.2],
  "prisma::relation-summary-naive": [180, 230],
  "jdbc::relation-summary-naive": [180, 230],
  "prisma::relation-summary-best-effort": [1.5, 3],
  "jdbc::relation-summary-best-effort": [1.5, 3],
  "prisma::n-plus-one-trap-naive": [90, 115],
  "jdbc::n-plus-one-trap-naive": [280, 320],
  "prisma::n-plus-one-trap-idiomatic": [2.5, 4],
  "jdbc::n-plus-one-trap-idiomatic": [1.5, 3],
  "prisma::n-plus-one-trap-best-effort": [0.8, 1.5],
  "jdbc::n-plus-one-trap-best-effort": [1.5, 3],
  "prisma::transaction-write": [6, 8],
  "jdbc::transaction-write": [4, 6],
  "prisma::report-aggregation-best-effort": [0.8, 1.5],
  "jdbc::report-aggregation-best-effort": [0.8, 1.2]
};

const failures = [];

if (rows.length === 0) failures.push("No result rows found");
if (requireEditorial && data.methodology?.mode !== "editorial") failures.push(`Expected editorial mode, got ${data.methodology?.mode}`);
if (requireEditorial && Number(data.methodology?.runs) !== 3) failures.push(`Expected 3 runs, got ${data.methodology?.runs}`);
if (requireEditorial && Number(data.methodology?.requests) !== 300) failures.push(`Expected 300 requests, got ${data.methodology?.requests}`);
if (requireEditorial && Number(data.methodology?.warmup) !== 30) failures.push(`Expected 30 warmup, got ${data.methodology?.warmup}`);
if (requireEditorial && Number(data.methodology?.concurrency) !== 16) failures.push(`Expected concurrency 16, got ${data.methodology?.concurrency}`);

for (const row of rows) {
  if (Number(row.total_requests) !== Number(row.successful_requests)) {
    failures.push(`${row.stack}/${row.scenario}/run${row.run}: ${row.successful_requests}/${row.total_requests} successful`);
  }
  if (Number(row.error_rate) !== 0) {
    failures.push(`${row.stack}/${row.scenario}/run${row.run}: error_rate ${row.error_rate}`);
  }
  const key = `${row.stack}::${row.scenario}`;
  const range = expectedRanges[key];
  if (!range) {
    failures.push(`No SQL/request expectation for ${key}`);
    continue;
  }
  const sqlPerRequest = Number(row.avg_sql_queries_per_successful_request);
  if (sqlPerRequest < range[0] || sqlPerRequest > range[1]) {
    failures.push(`${key}/run${row.run}: SQL/request ${sqlPerRequest} outside [${range[0]}, ${range[1]}]`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Verified ${rows.length} result rows from ${input}`);
