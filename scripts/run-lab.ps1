param(
  [ValidateSet("smoke", "editorial")]
  [string]$Mode = "smoke",
  [ValidateSet("small", "medium", "editorial", "large")]
  [string]$Size = "small",
  [string]$JavaHome = "",
  [string]$RunLabel = "",
  [int]$Runs = $(if ($Mode -eq "editorial") { 3 } else { 1 }),
  [int]$Requests = $(if ($Mode -eq "editorial") { 300 } else { 20 }),
  [int]$Warmup = $(if ($Mode -eq "editorial") { 30 } else { 5 }),
  [int]$Concurrency = $(if ($Mode -eq "editorial") { 16 } else { 4 }),
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$dbPort = if ($env:LAB_DB_PORT) { $env:LAB_DB_PORT } else { "55432" }
$prismaPort = if ($env:LAB_PRISMA_PORT) { $env:LAB_PRISMA_PORT } else { "3101" }
$jdbcPort = if ($env:LAB_JDBC_PORT) { $env:LAB_JDBC_PORT } else { "3102" }

if ($JavaHome) {
  $resolvedJavaHome = Resolve-Path $JavaHome
  $env:JAVA_HOME = $resolvedJavaHome.Path
  $env:PATH = "$($resolvedJavaHome.Path)\bin;$env:PATH"
}

New-Item -ItemType Directory -Force results/raw | Out-Null
Remove-Item results/comparison.csv, results/comparison.md, results/raw/latest.json -ErrorAction SilentlyContinue

docker compose up -d postgres
docker compose config --quiet

if (-not $SkipBuild) {
  Push-Location apps/prisma-client
  try {
    pnpm install
    npx prisma generate
    pnpm build
    pnpm test
  }
  finally {
    Pop-Location
  }

  Push-Location apps/jdbc-service
  try {
    mvn test
    mvn package
  }
  finally {
    Pop-Location
  }
}

& .\scripts\seed.ps1 -Size $Size

$env:DATABASE_URL = "postgresql://lab:lab@localhost:$dbPort/lab?schema=public"
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:$dbPort/lab"
$env:SPRING_DATASOURCE_USERNAME = "lab"
$env:SPRING_DATASOURCE_PASSWORD = "lab"
$env:SERVER_PORT = "$jdbcPort"
$env:PORT = "$prismaPort"
$env:PRISMA_URL = "http://127.0.0.1:$prismaPort"
$env:JDBC_URL = "http://127.0.0.1:$jdbcPort"
$env:JAVA_TOOL_OPTIONS = "-Duser.timezone=UTC"

$prismaDir = Resolve-Path "apps/prisma-client"
$jdbcDir = Resolve-Path "apps/jdbc-service"
$prismaOut = Join-Path (Resolve-Path "results/raw") "prisma.out.log"
$prismaErr = Join-Path (Resolve-Path "results/raw") "prisma.err.log"
$jdbcOut = Join-Path (Resolve-Path "results/raw") "jdbc.out.log"
$jdbcErr = Join-Path (Resolve-Path "results/raw") "jdbc.err.log"
$prisma = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory $prismaDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $prismaOut -RedirectStandardError $prismaErr
$jdbc = Start-Process -FilePath "java" -ArgumentList "-jar target/jdbc-service-1.0.0.jar" -WorkingDirectory $jdbcDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $jdbcOut -RedirectStandardError $jdbcErr

try {
  $healthUrls = @("$($env:PRISMA_URL)/health", "$($env:JDBC_URL)/health")
  foreach ($url in $healthUrls) {
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
      try {
        Invoke-RestMethod -Uri $url -TimeoutSec 2 | Out-Null
        $ready = $true
        break
      }
      catch {
        Start-Sleep -Seconds 1
      }
    }
    if (-not $ready) {
      throw "Service did not become ready: $url"
    }
  }

  node scripts/smoke-endpoints.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Endpoint smoke failed with exit code $LASTEXITCODE."
  }

  $env:LAB_MODE = $Mode
  $env:LAB_RUNS = "$Runs"
  $env:LAB_REQUESTS = "$Requests"
  $env:LAB_WARMUP = "$Warmup"
  $env:LAB_CONCURRENCY = "$Concurrency"
  if ($RunLabel) {
    $env:LAB_RUN_LABEL = $RunLabel
  }
  node scripts/runner.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Runner failed with exit code $LASTEXITCODE. See results/raw/*.log."
  }
  node scripts/verify-results.mjs --input results/raw/latest.json --require-editorial $($Mode -eq "editorial")
  if ($LASTEXITCODE -ne 0) {
    throw "Result verification failed with exit code $LASTEXITCODE."
  }
  & .\scripts\compare-results.ps1
}
finally {
  if ($prisma -and -not $prisma.HasExited) { Stop-Process -Id $prisma.Id -Force }
  if ($jdbc -and -not $jdbc.HasExited) { Stop-Process -Id $jdbc.Id -Force }
}
