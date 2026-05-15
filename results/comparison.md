# Resultados comparativos

Generado: 2026-05-15T20:49:29.743Z

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
- Java: openjdk version "21.0.10" 2026-01-20 LTS
- Docker: Docker version 29.4.0, build 9d7ad9f

## Metodologia

- Modo: editorial
- Corridas por escenario: 3
- Requests medidos por corrida: 300
- Warmup por corrida: 30
- Concurrencia del runner: 16

Advertencia: estos numeros observan dos implementaciones concretas contra un dataset comun en esta maquina. No prueban que un lenguaje, VM u ORM sea universalmente mas rapido.

## Resultado observado

| scenario | level | stack | runs | rps ok avg | p95 ok ms avg | p99 ok ms avg | SQL/request avg | RSS MB last | DB conns last |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| n-plus-one-trap-best-effort | best-effort | jdbc | 3 | 425.99 | 84.84 | 122.78 | 2 | 109.2 | 23 |
| n-plus-one-trap-best-effort | best-effort | prisma | 3 | 528.24 | 44.78 | 51.01 | 1 | 320 | 23 |
| n-plus-one-trap-idiomatic | idiomatic | jdbc | 3 | 380.91 | 77.38 | 98.49 | 2 | 101.1 | 23 |
| n-plus-one-trap-idiomatic | idiomatic | prisma | 3 | 160.73 | 156.9 | 175.96 | 3 | 320 | 23 |
| n-plus-one-trap-naive | naive | jdbc | 3 | 13.93 | 1775.81 | 2174.03 | 301 | 89.9 | 23 |
| n-plus-one-trap-naive | naive | prisma | 3 | 22.71 | 908.93 | 1020.71 | 103.04 | 319.9 | 23 |
| paginated-list | idiomatic | jdbc | 3 | 569.6 | 49.53 | 64.59 | 1 | 108.7 | 23 |
| paginated-list | idiomatic | prisma | 3 | 660.84 | 31.87 | 34.69 | 1 | 285 | 23 |
| read-by-id | idiomatic | jdbc | 3 | 584.55 | 54.88 | 76.71 | 1 | 92.4 | 23 |
| read-by-id | idiomatic | prisma | 3 | 420.68 | 58.44 | 71.51 | 4 | 285 | 23 |
| read-by-id-best-effort | best-effort | jdbc | 3 | 741.06 | 37.62 | 45.91 | 1 | 96.4 | 23 |
| read-by-id-best-effort | best-effort | prisma | 3 | 750.64 | 33.83 | 37.97 | 1 | 285 | 23 |
| relation-summary-best-effort | best-effort | jdbc | 3 | 30.65 | 969.55 | 1436.12 | 2 | 112.8 | 23 |
| relation-summary-best-effort | best-effort | prisma | 3 | 30.79 | 791.46 | 924.95 | 2.04 | 286.2 | 23 |
| relation-summary-naive | naive | jdbc | 3 | 3.21 | 7407.76 | 8958.82 | 201 | 102.2 | 23 |
| relation-summary-naive | naive | prisma | 3 | 3.08 | 6249.24 | 7016.76 | 201.26 | 289.5 | 23 |
| report-aggregation-best-effort | best-effort | jdbc | 3 | 118.8 | 211.83 | 253.71 | 1 | 101.8 | 23 |
| report-aggregation-best-effort | best-effort | prisma | 3 | 127.59 | 189.51 | 239.56 | 1.01 | 320 | 23 |
| transaction-write | idiomatic | jdbc | 3 | 328.69 | 86.41 | 106.34 | 5 | 89.1 | 23 |
| transaction-write | idiomatic | prisma | 3 | 253.35 | 86.86 | 94.99 | 7 | 320 | 23 |

## Interpretacion

- La comparacion mas defendible es naive vs idiomatic vs best-effort dentro de cada stack cuando existen variantes equivalentes.
- report-aggregation y relation-summary-best-effort miden el valor de SQL explicito cuando el shape del dato es agregacional.
- transaction-write observa costo de transaccion HTTP + driver + pool + escritura; no aisla solo el motor de base de datos.

## Que NO se puede concluir

- No se puede afirmar que Prisma, JDBC, Node o Java sean siempre mas rapidos o mas lentos.
- No se puede extrapolar throughput absoluto a produccion sin controlar CPU, red, pool sizing, GC, indices, plan cache y carga mixta.
- RSS es aproximado; en Java se reporta heap+non-heap desde la JVM si no hay medicion nativa de proceso.

## Datos crudos

Ver `results/comparison.csv` y `results/raw/latest.json`.
