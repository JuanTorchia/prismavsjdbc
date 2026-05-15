param(
  [ValidateSet("smoke", "editorial")]
  [string]$Mode = "smoke",
  [ValidateSet("small", "medium", "editorial", "large")]
  [string]$Size = "small",
  [string]$JavaHome = "C:\Users\jstor\scoop\apps\temurin25-jdk\current",
  [int]$Runs = $(if ($Mode -eq "editorial") { 3 } else { 1 }),
  [int]$Requests = $(if ($Mode -eq "editorial") { 300 } else { 20 }),
  [int]$Warmup = $(if ($Mode -eq "editorial") { 30 } else { 5 }),
  [int]$Concurrency = $(if ($Mode -eq "editorial") { 16 } else { 4 }),
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$versions = @("20.18.0", "22.17.1", "24.11.1", "25.2.1")
$restoreVersion = "24.11.1"

New-Item -ItemType Directory -Force results/matrix | Out-Null

try {
  foreach ($version in $versions) {
    Write-Host "Running Node matrix entry node-$version"
    nvm use $version
    if ($LASTEXITCODE -ne 0) {
      throw "nvm use $version failed"
    }

    & .\scripts\run-lab.ps1 `
      -Mode $Mode `
      -Size $Size `
      -JavaHome $JavaHome `
      -RunLabel "node-$version" `
      -Runs $Runs `
      -Requests $Requests `
      -Warmup $Warmup `
      -Concurrency $Concurrency `
      -SkipBuild:$SkipBuild

    Copy-Item results/comparison.csv "results/matrix/node-$version-$Mode-comparison.csv" -Force
    Copy-Item results/comparison.md "results/matrix/node-$version-$Mode-comparison.md" -Force
    Copy-Item results/raw/latest.json "results/matrix/node-$version-$Mode-latest.json" -Force
  }
}
finally {
  Write-Host "Restoring Node $restoreVersion"
  nvm use $restoreVersion
}

Write-Host "Node matrix completed. See results/matrix."
