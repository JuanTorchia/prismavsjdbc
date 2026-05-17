# Prisma vs JDBC: Reproducible Lab

Related article:

- English: [Prisma vs JDBC: the benchmark that almost made me blame the wrong ORM](https://juanchi.dev/en/blog/prisma-vs-jdbc-benchmark-query-shape-n1)
- Español: [Prisma vs JDBC: el benchmark que casi me hace culpar al ORM equivocado](https://juanchi.dev/es/blog/prisma-vs-jdbc-benchmark-query-shape-n1)

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

If `java -version` is not Java 21, pin the baseline explicitly:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16 -JavaHome 'C:\Users\jstor\scoop\apps\temurin21-jdk\current'
```

Bash:

```bash
bash scripts/run-lab.sh --mode editorial --size editorial --runs 3 --requests 300 --warmup 30 --concurrency 16
```

## Commands

See [docs/commands-es-en.md](docs/commands-es-en.md) for bilingual PowerShell and Bash command coverage.

See [docs/content-assets.md](docs/content-assets.md) for charts, screenshots, and content asset generation.

## Interpretation

The main results now carry a `level` column: `naive`, `idiomatic`, or `best-effort`. Not every scenario has all three levels; variants are added only when they change the query shape in a defensible way.

The most defensible comparison is not "Prisma vs JDBC" in the abstract. It is:

- naive vs idiomatic vs best-effort within Prisma when defensible variants exist;
- naive vs idiomatic vs best-effort within JDBC when the shape actually changes;
- ergonomic ORM code vs explicit SQL when the data shape requires it;
- full transaction cost across HTTP + driver + pool + DB.

Do not publish absolute numbers as universal truth. Publish CPU, OS, Docker, Node, Java, runner parameters, dataset size, and the methodology warnings.
