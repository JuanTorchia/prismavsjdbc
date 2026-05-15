import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import os from "node:os";
import { execSync } from "node:child_process";

const mode = process.env.LAB_MODE ?? "smoke";
const runLabel = process.env.LAB_RUN_LABEL ?? "";
const runs = Number(process.env.LAB_RUNS ?? (mode === "editorial" ? 3 : 1));
const concurrency = Number(process.env.LAB_CONCURRENCY ?? (mode === "editorial" ? 16 : 4));
const requests = Number(process.env.LAB_REQUESTS ?? (mode === "editorial" ? 300 : 20));
const warmup = Number(process.env.LAB_WARMUP ?? (mode === "editorial" ? 30 : 5));
const outDir = process.env.LAB_OUT_DIR ?? "results/raw";
const taskId = "00000000-0000-4000-0100-000000000001";
const projectId = "00000000-0000-4000-0020-000000000001";

const stacks = [
  { name: "prisma", baseUrl: process.env.PRISMA_URL ?? "http://localhost:3001" },
  { name: "jdbc", baseUrl: process.env.JDBC_URL ?? "http://localhost:3002" }
];

const scenarios = [
  { name: "read-by-id", method: "GET", path: `/tasks/${taskId}` },
  { name: "paginated-list", method: "GET", path: `/tasks?status=TODO&projectId=${projectId}&createdFrom=2024-01-01T00:00:00Z&limit=50&offset=0` },
  { name: "relation-summary-naive", method: "GET", path: "/relation-summary?mode=naive&limit=100" },
  { name: "relation-summary-optimized", method: "GET", path: "/relation-summary?mode=optimized&limit=100" },
  { name: "n-plus-one-trap-naive", method: "GET", path: "/n-plus-one-trap?mode=naive" },
  { name: "n-plus-one-trap-optimized", method: "GET", path: "/n-plus-one-trap?mode=optimized" },
  { name: "transaction-write", method: "POST", path: "/transaction-write" },
  { name: "report-aggregation", method: "GET", path: "/report-aggregation" }
];

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function call(url, method) {
  const started = performance.now();
  try {
    const response = await fetch(url, { method });
    await response.arrayBuffer();
    return { ok: response.ok, ms: performance.now() - started };
  } catch {
    return { ok: false, ms: performance.now() - started };
  }
}

async function runBatch(stack, scenario, total) {
  const latencies = [];
  const successfulLatencies = [];
  let success = 0;
  let index = 0;
  const started = performance.now();
  async function worker() {
    while (index < total) {
      index += 1;
      const result = await call(stack.baseUrl + scenario.path, scenario.method);
      latencies.push(result.ms);
      if (result.ok) {
        success += 1;
        successfulLatencies.push(result.ms);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedSeconds = (performance.now() - started) / 1000;
  return {
    total_requests: total,
    successful_requests: success,
    error_rate: total === 0 ? 0 : (total - success) / total,
    successful_requests_per_second: elapsedSeconds === 0 ? 0 : success / elapsedSeconds,
    p50_ms: percentile(latencies, 50),
    p95_ms: percentile(latencies, 95),
    p99_ms: percentile(latencies, 99),
    successful_p95_ms: percentile(successfulLatencies, 95),
    successful_p99_ms: percentile(successfulLatencies, 99)
  };
}

function round(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${url} -> ${response.status}`);
  return response.json();
}

function versionInfo() {
  const safe = (cmd) => {
    try {
      const output = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split(/\r?\n/);
      return output.find((line) => /version/i.test(line) && !/JAVA_TOOL_OPTIONS/.test(line)) ?? output[0] ?? "unavailable";
    } catch {
      return "unavailable";
    }
  };
  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    cpu_count: os.cpus().length,
    node: process.version,
    java: safe("java -version 2>&1"),
    docker: safe("docker --version")
  };
}

await mkdir(outDir, { recursive: true });
const rows = [];

for (const stack of stacks) {
  await getJson(`${stack.baseUrl}/health`);
}

for (let run = 1; run <= runs; run += 1) {
  for (const stack of stacks) {
    for (const scenario of scenarios) {
      await runBatch(stack, scenario, warmup);
      await getJson(`${stack.baseUrl}/metrics/reset`, { method: "POST" });
      const result = await runBatch(stack, scenario, requests);
      const metrics = await getJson(`${stack.baseUrl}/metrics`);
      const sqlQueryCount = Number(metrics.sql_query_count ?? 0);
      rows.push({
        run,
        mode,
        run_label: runLabel,
        stack: stack.name,
        scenario: scenario.name,
        total_requests: result.total_requests,
        successful_requests: result.successful_requests,
        error_rate: round(result.error_rate),
        successful_requests_per_second: round(result.successful_requests_per_second),
        p50_ms: round(result.p50_ms),
        p95_ms: round(result.p95_ms),
        p99_ms: round(result.p99_ms),
        successful_p95_ms: round(result.successful_p95_ms),
        successful_p99_ms: round(result.successful_p99_ms),
        sql_query_count: sqlQueryCount,
        avg_sql_queries_per_successful_request: result.successful_requests === 0 ? 0 : round(sqlQueryCount / result.successful_requests),
        app_rss_mb: Number(metrics.app_rss_mb ?? 0),
        db_connections_used: Number(metrics.db_connections_used ?? 0),
        notes: "Runner propio HTTP; no es benchmark universal. RSS JDBC usa heap+nonheap si RSS real no esta disponible."
      });
      console.log(`${stack.name} ${scenario.name} run ${run}: ${result.successful_requests}/${result.total_requests}`);
    }
  }
}

const payload = {
  generated_at: new Date().toISOString(),
  methodology: { mode, runs, requests, warmup, concurrency },
  environment: versionInfo(),
  rows
};

await writeFile(`${outDir}/latest.json`, JSON.stringify(payload, null, 2));
