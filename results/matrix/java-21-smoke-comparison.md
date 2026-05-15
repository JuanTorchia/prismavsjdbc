# Resultados comparativos

Generado: 05/15/2026 18:07:36

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
- Java: openjdk version "21.0.10" 2026-01-20 LTS
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
| n-plus-one-trap-naive | jdbc | 1 | 10.09 | 522.42 | 548.45 | 301 | 83.8 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 21.1 | 224.47 | 227.42 | 103 | 192.4 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 294.76 | 21.02 | 24.44 | 2 | 92.2 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 142.89 | 38.9 | 40.53 | 4 | 193.2 | 13 |
| paginated-list | jdbc | 1 | 228.08 | 22.99 | 32.08 | 1 | 78.2 | 18 |
| paginated-list | prisma | 1 | 667.94 | 9.3 | 10.31 | 1 | 126 | 4 |
| read-by-id | jdbc | 1 | 328.2 | 17.47 | 22.52 | 1 | 72.9 | 16 |
| read-by-id | prisma | 1 | 492.67 | 11.63 | 11.77 | 4 | 125.2 | 4 |
| relation-summary-naive | jdbc | 1 | 15.73 | 288.52 | 297.44 | 201 | 74.3 | 23 |
| relation-summary-naive | prisma | 1 | 18.09 | 258.39 | 282.35 | 201 | 156.4 | 13 |
| relation-summary-optimized | jdbc | 1 | 177.09 | 41.16 | 48.12 | 2 | 83.1 | 23 |
| relation-summary-optimized | prisma | 1 | 401.77 | 11.65 | 12.59 | 2 | 157.3 | 13 |
| report-aggregation | jdbc | 1 | 216.47 | 28.21 | 31.48 | 1 | 89.3 | 23 |
| report-aggregation | prisma | 1 | 227.56 | 25.86 | 27.12 | 1 | 193.7 | 13 |
| transaction-write | jdbc | 1 | 158.27 | 37.47 | 38.95 | 5 | 92.8 | 23 |
| transaction-write | prisma | 1 | 162.28 | 35.8 | 38.01 | 7 | 192.8 | 13 |

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
