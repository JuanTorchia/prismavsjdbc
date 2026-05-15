# Prisma vs JDBC: Reproducible Lab

This repository compares two real stacks against the same PostgreSQL 16 database, dataset, and business scenarios:

- Node.js 24 LTS + TypeScript + Prisma 5.
- Spring Boot 3 + Java 21/25 LTS + direct JDBC through `JdbcTemplate`.

This is not a simplistic "who wins" benchmark. It measures abstraction cost and tradeoffs: query shape, N+1, latency, useful throughput, approximate memory, SQL query count, transaction behavior, code ergonomics, and the risk of drawing false conclusions.

## Quick Start

PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode smoke -Size small
```

Bash:

```bash
bash scripts/run-lab.sh --mode smoke --size small
```

## Editorial Run

PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

Bash:

```bash
bash scripts/run-lab.sh --mode editorial --size editorial --runs 3 --requests 300 --warmup 30 --concurrency 16
```

## Commands

See [docs/commands-es-en.md](docs/commands-es-en.md) for bilingual PowerShell and Bash command coverage.

See [docs/content-assets.md](docs/content-assets.md) for charts, screenshots, and content asset generation.

## Interpretation

The most defensible comparison is not "Prisma vs JDBC" in the abstract. It is:

- naive vs optimized within Prisma;
- naive vs optimized within JDBC;
- ergonomic ORM code vs explicit SQL when the data shape requires it;
- full transaction cost across HTTP + driver + pool + DB.

Do not publish absolute numbers as universal truth. Publish CPU, OS, Docker, Node, Java, runner parameters, dataset size, and the methodology warnings.
