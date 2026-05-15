param(
  [ValidateSet("small", "medium", "editorial", "large")]
  [string]$Size = "small"
)

$ErrorActionPreference = "Stop"
$dbPort = if ($env:LAB_DB_PORT) { $env:LAB_DB_PORT } else { "55432" }
$env:DATABASE_URL = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://lab:lab@localhost:$dbPort/lab?schema=public" }
$env:LAB_SIZE = $Size

Push-Location apps/prisma-client
try {
  npx prisma db push
  pnpm seed
}
finally {
  Pop-Location
}
