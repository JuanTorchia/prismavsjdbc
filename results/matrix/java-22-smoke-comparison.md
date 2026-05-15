# Resultados comparativos

Generado: 05/15/2026 18:08:01

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
- Java: openjdk version "22.0.2" 2024-07-16
- Docker: Docker version 29.4.0, build 9d7ad9f

## Metodologia

- Modo: smoke
- Corridas por escenario: 1
- Requests medidos por corrida: 20
- Warmup por corrida: 5
- Concurrencia del runner: 4

Advertencia: estos numeros observan dos implementaciones concretas contra un dataset comun en esta maquina. No prueban que un lenguaje, VM u ORM sea universalmente mas rapido.

## Resultado observado

| scenario | stack | runs | rps ok avg | p95 ok ms avg | p99 ok ms avg | SQL/request avg | RSS MB last | DB conns last |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| n-plus-one-trap-naive | jdbc | 1 | 11.72 | 463.07 | 466.12 | 301 | 83.2 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 14.76 | 403.75 | 422.91 | 103 | 195.5 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 308.1 | 14.19 | 17.34 | 2 | 91.5 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 41.07 | 124.64 | 128.41 | 4 | 197.1 | 13 |
| paginated-list | jdbc | 1 | 237.12 | 28.18 | 37.51 | 1 | 74 | 19 |
| paginated-list | prisma | 1 | 893.03 | 4.96 | 4.99 | 1 | 126.1 | 4 |
| read-by-id | jdbc | 1 | 339.21 | 17.14 | 19.62 | 1 | 72.9 | 17 |
| read-by-id | prisma | 1 | 492.36 | 11.91 | 12.93 | 4 | 125.5 | 4 |
| relation-summary-naive | jdbc | 1 | 16.64 | 271.28 | 272.19 | 201 | 74.1 | 23 |
| relation-summary-naive | prisma | 1 | 11.12 | 588.32 | 623.17 | 201 | 161.3 | 13 |
| relation-summary-optimized | jdbc | 1 | 176.07 | 30.46 | 36.41 | 2 | 78.9 | 23 |
| relation-summary-optimized | prisma | 1 | 116.18 | 59 | 60.51 | 2 | 164.8 | 13 |
| report-aggregation | jdbc | 1 | 182.68 | 38.14 | 42.1 | 1 | 84.7 | 23 |
| report-aggregation | prisma | 1 | 218.6 | 27.53 | 29.93 | 1 | 198.3 | 13 |
| transaction-write | jdbc | 1 | 101.54 | 48.72 | 52.66 | 5 | 92.3 | 23 |
| transaction-write | prisma | 1 | 46.77 | 196.7 | 206.6 | 7 | 197.5 | 13 |

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
