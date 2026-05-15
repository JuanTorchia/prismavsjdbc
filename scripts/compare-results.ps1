param(
  [string]$InputPath = "results/raw/latest.json",
  [string]$CsvPath = "results/comparison.csv",
  [string]$MarkdownPath = "results/comparison.md"
)

$ErrorActionPreference = "Stop"
$lang = if ($env:LAB_LANG) { $env:LAB_LANG } else { "es" }
node scripts/compare-results.mjs --input $InputPath --csv $CsvPath --markdown $MarkdownPath --lang $lang
