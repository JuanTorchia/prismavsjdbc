# Resultados comparativos

Generado: 05/15/2026 18:10:37

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v25.2.1
- Java: openjdk version "25.0.2" 2026-01-20 LTS
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
| n-plus-one-trap-naive | jdbc | 1 | 10.29 | 542.54 | 552.98 | 301 | 82.9 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 34.51 | 134.83 | 137.93 | 103 | 192.3 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 355.62 | 14.48 | 15.33 | 2 | 91.2 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 224.34 | 21.65 | 22.57 | 4 | 193.9 | 13 |
| paginated-list | jdbc | 1 | 236.91 | 31.12 | 31.28 | 1 | 89.9 | 17 |
| paginated-list | prisma | 1 | 950.95 | 4.57 | 4.73 | 1 | 127.3 | 4 |
| read-by-id | jdbc | 1 | 419.75 | 12.42 | 12.49 | 1 | 84.7 | 16 |
| read-by-id | prisma | 1 | 672.86 | 7.45 | 7.48 | 4 | 126.6 | 4 |
| relation-summary-naive | jdbc | 1 | 19.25 | 216.54 | 218.23 | 201 | 80.5 | 23 |
| relation-summary-naive | prisma | 1 | 14.99 | 320.27 | 342.82 | 201 | 157.3 | 13 |
| relation-summary-optimized | jdbc | 1 | 197.49 | 27.23 | 30.24 | 2 | 89.2 | 23 |
| relation-summary-optimized | prisma | 1 | 249.16 | 20.85 | 25.09 | 2 | 158.5 | 13 |
| report-aggregation | jdbc | 1 | 324.28 | 16.29 | 17.96 | 1 | 80.6 | 23 |
| report-aggregation | prisma | 1 | 449.32 | 12.45 | 12.7 | 1 | 194.3 | 13 |
| transaction-write | jdbc | 1 | 231.9 | 21.32 | 22.36 | 5 | 95.7 | 23 |
| transaction-write | prisma | 1 | 305.69 | 15.53 | 16.65 | 7 | 194.3 | 13 |

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
