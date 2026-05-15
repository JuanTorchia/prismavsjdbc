# Resultados comparativos

Generado: 05/15/2026 18:10:00

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
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
| n-plus-one-trap-naive | jdbc | 1 | 9.54 | 555.84 | 574.31 | 301 | 82.9 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 28.28 | 157.73 | 174.57 | 103 | 185.3 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 334.84 | 14.65 | 16 | 2 | 91.2 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 91.37 | 66.54 | 82.93 | 4 | 185.5 | 13 |
| paginated-list | jdbc | 1 | 293.1 | 18.71 | 28.44 | 1 | 89.8 | 18 |
| paginated-list | prisma | 1 | 704.63 | 6.88 | 7.21 | 1 | 126.1 | 4 |
| read-by-id | jdbc | 1 | 325.61 | 20.04 | 21.09 | 1 | 84.8 | 16 |
| read-by-id | prisma | 1 | 561.72 | 8.64 | 9.72 | 4 | 125 | 4 |
| relation-summary-naive | jdbc | 1 | 17.46 | 247.74 | 249.18 | 201 | 80.6 | 23 |
| relation-summary-naive | prisma | 1 | 15.21 | 313.17 | 342.74 | 201 | 157.7 | 13 |
| relation-summary-optimized | jdbc | 1 | 207.01 | 25.01 | 25.64 | 2 | 89.2 | 23 |
| relation-summary-optimized | prisma | 1 | 403.37 | 11.15 | 11.79 | 2 | 159.2 | 13 |
| report-aggregation | jdbc | 1 | 219.19 | 35.08 | 38.38 | 1 | 80.6 | 23 |
| report-aggregation | prisma | 1 | 438.32 | 11.41 | 11.47 | 1 | 187.3 | 13 |
| transaction-write | jdbc | 1 | 200.75 | 27.52 | 27.61 | 5 | 91.7 | 23 |
| transaction-write | prisma | 1 | 208.86 | 38 | 39.87 | 7 | 186.3 | 13 |

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
