# Comparative Results

Generated: 2026-05-15T19:56:48.502Z

## Environment

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
- Java: openjdk version "21.0.10" 2026-01-20 LTS
- Docker: Docker version 29.4.0, build 9d7ad9f

## Methodology

- Mode: editorial
- Runs per scenario: 3
- Measured requests per run: 300
- Warmup requests per run: 30
- Runner concurrency: 16

Warning: these numbers observe two concrete implementations against a shared dataset on this machine. They do not prove that a language, VM, or ORM is universally faster.

## Observed Result

| scenario | stack | runs | rps ok avg | p95 ok ms avg | p99 ok ms avg | SQL/request avg | RSS MB last | DB conns last |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| n-plus-one-trap-naive | jdbc | 3 | 15.02 | 2269.09 | 2749.08 | 301 | 109.8 | 23 |
| n-plus-one-trap-naive | prisma | 3 | 24.77 | 925.73 | 1043.13 | 103.03 | 341.9 | 23 |
| n-plus-one-trap-optimized | jdbc | 3 | 486.48 | 70.16 | 96.1 | 2 | 111.9 | 23 |
| n-plus-one-trap-optimized | prisma | 3 | 162.35 | 206.04 | 295.13 | 4 | 343.6 | 23 |
| paginated-list | jdbc | 3 | 713.07 | 74.66 | 122.24 | 1 | 106.7 | 23 |
| paginated-list | prisma | 3 | 619.05 | 43.48 | 46.9 | 1 | 160.9 | 23 |
| read-by-id | jdbc | 3 | 940.7 | 58.99 | 89.85 | 1 | 90.6 | 23 |
| read-by-id | prisma | 3 | 483.77 | 61.74 | 81.6 | 4 | 160 | 23 |
| relation-summary-naive | jdbc | 3 | 3.83 | 6584.76 | 8094.27 | 201 | 103.9 | 23 |
| relation-summary-naive | prisma | 3 | 3.48 | 6192.05 | 6908.86 | 201.24 | 292.1 | 23 |
| relation-summary-optimized | jdbc | 3 | 28.96 | 1127.1 | 1538.15 | 2 | 99.2 | 23 |
| relation-summary-optimized | prisma | 3 | 31.42 | 806.65 | 943.22 | 2.04 | 291 | 23 |
| report-aggregation | jdbc | 3 | 123.54 | 223.98 | 302.87 | 1 | 92.7 | 23 |
| report-aggregation | prisma | 3 | 123.57 | 202.15 | 262.09 | 1.01 | 348.8 | 23 |
| transaction-write | jdbc | 3 | 403.95 | 145.04 | 161.86 | 5 | 95.9 | 23 |
| transaction-write | prisma | 3 | 235.63 | 231.05 | 284.28 | 7.01 | 344 | 23 |

## Interpretation

- The most defensible comparison is naive vs optimized within each stack, especially in relation-summary and n-plus-one-trap.
- report-aggregation measures the value of explicit SQL when the data shape is aggregational.
- transaction-write observes the cost of HTTP + driver + pool + write transaction; it does not isolate the database engine alone.

## What You Cannot Conclude

- You cannot claim Prisma, JDBC, Node, or Java are always faster or slower.
- You cannot extrapolate absolute throughput to production without controlling CPU, network, pool sizing, GC, indexes, plan cache, and mixed load.
- RSS is approximate; Java reports heap + non-heap from the JVM when native process RSS is unavailable.

## Raw Data

See `results/comparison.csv` and `results/raw/latest.json`.
