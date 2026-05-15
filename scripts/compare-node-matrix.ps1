param(
  [string]$Mode = "smoke",
  [string]$OutputPath = "results/matrix/node-matrix-summary.md"
)

$ErrorActionPreference = "Stop"

$versions = @("20.18.0", "22.17.1", "24.11.1", "25.2.1")

function To-Number($value) {
  $normalized = ([string]$value).Replace(",", ".")
  return [double]::Parse($normalized, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Summarize($label, $path) {
  Import-Csv $path |
    Where-Object stack -eq "prisma" |
    Group-Object scenario |
    ForEach-Object {
      $items = @($_.Group)
      [pscustomobject]@{
        node = $label
        scenario = $items[0].scenario
        rps = [math]::Round((($items | ForEach-Object { To-Number $_.successful_requests_per_second } | Measure-Object -Average).Average), 2)
        p95 = [math]::Round((($items | ForEach-Object { To-Number $_.successful_p95_ms } | Measure-Object -Average).Average), 2)
        sql_per_request = [math]::Round((($items | ForEach-Object { To-Number $_.avg_sql_queries_per_successful_request } | Measure-Object -Average).Average), 2)
      }
    }
}

$all = @()
foreach ($version in $versions) {
  $path = "results/matrix/node-$version-$Mode-comparison.csv"
  if (!(Test-Path $path)) {
    throw "No existe $path. Ejecuta scripts/run-node-matrix.ps1 primero."
  }
  $all += Summarize "node-$version" $path
}

$baseline = $all | Where-Object node -eq "node-24.11.1"
$joined = foreach ($row in $all) {
  $base = $baseline | Where-Object scenario -eq $row.scenario | Select-Object -First 1
  [pscustomobject]@{
    node = $row.node
    scenario = $row.scenario
    p95 = $row.p95
    p95_delta_vs_24_pct = if ($base.p95 -eq 0) { 0 } else { [math]::Round((($row.p95 - $base.p95) / $base.p95) * 100, 1) }
    rps = $row.rps
    rps_delta_vs_24_pct = if ($base.rps -eq 0) { 0 } else { [math]::Round((($row.rps - $base.rps) / $base.rps) * 100, 1) }
    sql_per_request = $row.sql_per_request
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Matriz Node")
$lines.Add("")
$lines.Add("Modo: ``$Mode``")
$lines.Add("")
$lines.Add("Baseline editorial recomendado: Node 24 LTS. Esta matriz mide sensibilidad del runtime Node para la app Prisma; no cambia el argumento principal del post.")
$lines.Add("")
$lines.Add("| node | scenario | p95 ms | delta p95 vs Node 24 % | rps | delta rps vs Node 24 % | SQL/request |")
$lines.Add("|---|---|---:|---:|---:|---:|---:|")
foreach ($r in ($joined | Sort-Object scenario, node)) {
  $lines.Add("| $($r.node) | $($r.scenario) | $($r.p95) | $($r.p95_delta_vs_24_pct) | $($r.rps) | $($r.rps_delta_vs_24_pct) | $($r.sql_per_request) |")
}
$lines.Add("")
$lines.Add("## Nota metodologica")
$lines.Add("")
$lines.Add("- Node 20 y 22 son utiles para sensibilidad historica; Node 24 es el baseline LTS recomendado.")
$lines.Add("- Node 25 es Current/no-LTS en esta matriz; no usar como baseline editorial sin aclararlo.")
$lines.Add("- Si una version falla, reportarlo como compatibilidad observada y no como dato de performance.")

$lines | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Wrote $OutputPath"
