param(
  [string]$Mode = "editorial",
  [string]$OutputPath = "results/matrix/java-matrix-summary.md"
)

$ErrorActionPreference = "Stop"

$candidateFiles = @(
  [pscustomobject]@{ label = "java-21"; path = "results/matrix/java-21-$Mode-comparison.csv" },
  [pscustomobject]@{ label = "java-22"; path = "results/matrix/java-22-$Mode-comparison.csv" },
  [pscustomobject]@{ label = "java-25"; path = "results/matrix/java-25-$Mode-comparison.csv" }
)

$files = @($candidateFiles | Where-Object { Test-Path $_.path })
if ($files.Count -eq 0) {
  throw "No hay archivos Java para modo $Mode. Ejecuta scripts/run-java-matrix.ps1 primero."
}
if (!(Test-Path "results/matrix/java-21-$Mode-comparison.csv")) {
  throw "Falta baseline Java 21 para modo $Mode."
}

function To-Number($value) {
  $normalized = ([string]$value).Replace(",", ".")
  return [double]::Parse($normalized, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Summarize($label, $path) {
  Import-Csv $path |
    Group-Object stack, scenario |
    ForEach-Object {
      $items = @($_.Group)
      [pscustomobject]@{
        java = $label
        stack = $items[0].stack
        scenario = $items[0].scenario
        rps = [math]::Round((($items | ForEach-Object { To-Number $_.successful_requests_per_second } | Measure-Object -Average).Average), 2)
        p95 = [math]::Round((($items | ForEach-Object { To-Number $_.successful_p95_ms } | Measure-Object -Average).Average), 2)
        p99 = [math]::Round((($items | ForEach-Object { To-Number $_.successful_p99_ms } | Measure-Object -Average).Average), 2)
        sql_per_request = [math]::Round((($items | ForEach-Object { To-Number $_.avg_sql_queries_per_successful_request } | Measure-Object -Average).Average), 2)
      }
    }
}

$all = @()
foreach ($file in $files) {
  $all += Summarize $file.label $file.path
}

$baseline = $all | Where-Object java -eq "java-21"
$joined = foreach ($row in $all) {
  $base = $baseline | Where-Object { $_.stack -eq $row.stack -and $_.scenario -eq $row.scenario } | Select-Object -First 1
  [pscustomobject]@{
    java = $row.java
    stack = $row.stack
    scenario = $row.scenario
    p95 = $row.p95
    p95_delta_vs_21_pct = if ($base.p95 -eq 0) { 0 } else { [math]::Round((($row.p95 - $base.p95) / $base.p95) * 100, 1) }
    rps = $row.rps
    rps_delta_vs_21_pct = if ($base.rps -eq 0) { 0 } else { [math]::Round((($row.rps - $base.rps) / $base.rps) * 100, 1) }
    sql_per_request = $row.sql_per_request
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Matriz Java")
$lines.Add("")
$lines.Add("Modo: ``$Mode``")
$lines.Add("")
$lines.Add("Interpretacion: esta tabla mide sensibilidad de la JVM para el servicio JDBC y mantiene Node/Prisma como contexto de la corrida completa. No convierte el post en una comparacion de versiones Java.")
$lines.Add("")
$lines.Add("## JDBC")
$lines.Add("")
$lines.Add("| java | scenario | p95 ms | delta p95 vs Java 21 % | rps | delta rps vs Java 21 % | SQL/request |")
$lines.Add("|---|---|---:|---:|---:|---:|---:|")
foreach ($r in ($joined | Where-Object stack -eq "jdbc" | Sort-Object scenario)) {
  $lines.Add("| $($r.java) | $($r.scenario) | $($r.p95) | $($r.p95_delta_vs_21_pct) | $($r.rps) | $($r.rps_delta_vs_21_pct) | $($r.sql_per_request) |")
}
$lines.Add("")
$lines.Add("## Nota metodologica")
$lines.Add("")
$lines.Add("- El bytecode se mantiene compatible con Java 21 para poder ejecutar el mismo artefacto sobre JVM 21 y JVM 25.")
$lines.Add("- Los escenarios Prisma aparecen en los CSV porque la corrida completa conserva ambos stacks, pero esta matriz solo debe usarse para discutir sensibilidad del servicio JDBC.")
$lines.Add("- Diferencias pequenas no justifican claims fuertes; diferencias grandes requieren revisar GC, warmup, CPU disponible y variabilidad de Docker/host.")

$lines | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Wrote $OutputPath"
