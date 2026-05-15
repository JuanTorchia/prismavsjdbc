param(
  [ValidateSet("es", "en")]
  [string]$Lang = "es",
  [string]$ComparisonPath = "results/comparison.csv",
  [string]$OutDir = "results/assets"
)

$ErrorActionPreference = "Stop"
node scripts/generate-content-assets.mjs --comparison $ComparisonPath --out $OutDir --lang $Lang
