import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const input = args.get("input") ?? "results/assets/report.es.html";
const outDir = args.get("out") ?? "results/assets/screenshots";
const width = Number(args.get("width") ?? 1440);
const height = Number(args.get("height") ?? 1100);

await mkdir(outDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  chromium = null;
}

if (chromium) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.resolve(input)).href);
    await page.screenshot({ path: path.join(outDir, "report-full.png"), fullPage: true });
    for (const id of ["p95", "sql", "n1", "summary"]) {
      const locator = page.locator(`#${id}`);
      if (await locator.count()) {
        await locator.screenshot({ path: path.join(outDir, `${id}.png`) });
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`Wrote screenshots to ${outDir}`);
  process.exit(0);
}

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const browserCandidates = [
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "google-chrome",
  "chromium",
  "chromium-browser",
  "microsoft-edge"
].filter(Boolean);

let browserPath = null;
for (const candidate of browserCandidates) {
  if (candidate.includes("\\") || candidate.includes("/")) {
    if (await exists(candidate)) {
      browserPath = candidate;
      break;
    }
  } else {
    const check = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (check.status === 0) {
      browserPath = candidate;
      break;
    }
  }
}

if (!browserPath) {
  throw new Error("Neither Playwright nor Chrome/Edge headless was available for screenshots.");
}

function capture(url, output, extra = []) {
  const outputPath = path.resolve(output);
  const result = spawnSync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--screenshot=${outputPath}`,
    ...extra,
    url
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Browser screenshot failed for ${url}: ${result.stderr || result.stdout}`);
  }
}

capture(pathToFileURL(path.resolve(input)).href, path.join(outDir, "report-full.png"));
const assetDir = path.dirname(path.resolve(input));
const svgCaptures = [
  ["p95.png", "p95-by-scenario.svg"],
  ["sql.png", "sql-by-scenario.svg"],
  ["n1.png", "n-plus-one-impact.svg"],
  ["java-sensitivity-p95.png", "java-sensitivity-p95.svg"]
];
for (const [png, svg] of svgCaptures) {
  const svgPath = path.join(assetDir, svg);
  if (await exists(svgPath)) {
    capture(pathToFileURL(svgPath).href, path.join(outDir, png), [`--window-size=${width},${Math.min(height, 850)}`]);
  }
}
console.log(`Wrote screenshots to ${outDir}`);
