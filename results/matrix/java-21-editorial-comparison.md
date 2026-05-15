# Resultados comparativos

Generado: 05/15/2026 17:48:56

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

| scenario | stack | runs | rps ok avg | p95 ok ms avg | p99 ok ms avg | SQL/request avg | RSS MB last | DB conns last |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| n-plus-one-trap-naive | jdbc | 3 | 13.77 | 1813.7 | 2191.65 | 301 | 103.2 | 23 |
| n-plus-one-trap-naive | prisma | 3 | 26.1 | 858.04 | 964.54 | 103.01 | 334.7 | 23 |
| n-plus-one-trap-optimized | jdbc | 3 | 356.6 | 88.18 | 117.43 | 2 | 105.2 | 23 |
| n-plus-one-trap-optimized | prisma | 3 | 167.86 | 138 | 159.66 | 4.01 | 334.7 | 23 |
| paginated-list | jdbc | 3 | 506.01 | 72.52 | 89.28 | 1 | 90.7 | 23 |
| paginated-list | prisma | 3 | 424.4 | 75.91 | 82.65 | 1 | 154.9 | 23 |
| read-by-id | jdbc | 3 | 535.81 | 84.31 | 113.05 | 1 | 102.9 | 23 |
| read-by-id | prisma | 3 | 307.76 | 103.11 | 130.76 | 4 | 185 | 23 |
| relation-summary-naive | jdbc | 3 | 3.21 | 8135.78 | 10437.77 | 201 | 91.3 | 23 |
| relation-summary-naive | prisma | 3 | 3.32 | 6085.99 | 6810.37 | 201.26 | 330.7 | 23 |
| relation-summary-optimized | jdbc | 3 | 27.31 | 1039.44 | 1426.6 | 2 | 107.1 | 23 |
| relation-summary-optimized | prisma | 3 | 31.61 | 807.68 | 985.41 | 2.04 | 330.7 | 23 |
| report-aggregation | jdbc | 3 | 114.01 | 232.96 | 280.11 | 1 | 109.6 | 23 |
| report-aggregation | prisma | 3 | 123.57 | 208.38 | 257.83 | 1 | 334.7 | 23 |
| transaction-write | jdbc | 3 | 286.22 | 102.09 | 124.72 | 5 | 89.1 | 23 |
| transaction-write | prisma | 3 | 236.81 | 122.88 | 143.32 | 7.01 | 334.7 | 23 |

## Interpretacion

- La comparacion mas defendible es naive vs optimized dentro de cada stack, especialmente en relation-summary y n-plus-one-trap.
- report-aggregation mide el valor de SQL explicito cuando el shape del dato es agregacional.
- transaction-write observa costo de transaccion HTTP + driver + pool + escritura; no aisla solo el motor de base de datos.

## Que NO se puede concluir

- No se puede afirmar que Prisma, JDBC, Node o Java sean siempre mas rapidos o mas lentos.
- No se puede extrapolar throughput absoluto a produccion sin controlar CPU, red, pool sizing, GC, indices, plan cache y carga mixta.
- RSS es aproximado; en Java se reporta heap+non-heap desde la JVM si no hay medicion nativa de proceso.

## Datos crudos

Ver `results/comparison.csv` y `results/raw/latest.json`.
