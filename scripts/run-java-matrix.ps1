param(
  [ValidateSet("smoke", "editorial")]
  [string]$Mode = "smoke",
  [ValidateSet("small", "medium", "editorial", "large")]
  [string]$Size = "small",
  [int]$Runs = $(if ($Mode -eq "editorial") { 3 } else { 1 }),
  [int]$Requests = $(if ($Mode -eq "editorial") { 300 } else { 20 }),
  [int]$Warmup = $(if ($Mode -eq "editorial") { 30 } else { 5 }),
  [int]$Concurrency = $(if ($Mode -eq "editorial") { 16 } else { 4 }),
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$matrix = @(
  [pscustomobject]@{
    Label = "java-21"
    JavaHome = "C:\Users\jstor\scoop\apps\temurin21-jdk\current"
  },
  [pscustomobject]@{
    Label = "java-22"
    JavaHome = "C:\Program Files\OpenJDK\jdk-22.0.2"
  },
  [pscustomobject]@{
    Label = "java-25"
    JavaHome = "C:\Users\jstor\scoop\apps\temurin25-jdk\current"
  }
)

New-Item -ItemType Directory -Force results/matrix | Out-Null

foreach ($item in $matrix) {
  if (!(Test-Path $item.JavaHome)) {
    throw "No existe JavaHome para $($item.Label): $($item.JavaHome)"
  }

  Write-Host "Running matrix entry $($item.Label) with $($item.JavaHome)"
  & .\scripts\run-lab.ps1 `
    -Mode $Mode `
    -Size $Size `
    -JavaHome $item.JavaHome `
    -RunLabel $item.Label `
    -Runs $Runs `
    -Requests $Requests `
    -Warmup $Warmup `
    -Concurrency $Concurrency `
    -SkipBuild:$SkipBuild

  Copy-Item results/comparison.csv "results/matrix/$($item.Label)-$Mode-comparison.csv" -Force
  Copy-Item results/comparison.md "results/matrix/$($item.Label)-$Mode-comparison.md" -Force
  Copy-Item results/raw/latest.json "results/matrix/$($item.Label)-$Mode-latest.json" -Force
}

Write-Host "Java matrix completed. See results/matrix."
