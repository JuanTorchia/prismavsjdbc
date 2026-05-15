# Resultados comparativos

Generado: 05/15/2026 18:09:14

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v20.18.0
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
| n-plus-one-trap-naive | jdbc | 1 | 10.67 | 593.45 | 622 | 301 | 82.8 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 31.94 | 135.57 | 143.9 | 103 | 150.1 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 322.93 | 15.1 | 21.76 | 2 | 91.1 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 162.63 | 29 | 35.81 | 4 | 149.4 | 13 |
| paginated-list | jdbc | 1 | 242.66 | 28.32 | 39.24 | 1 | 90.5 | 18 |
| paginated-list | prisma | 1 | 848.87 | 5.38 | 6.5 | 1 | 107.9 | 4 |
| read-by-id | jdbc | 1 | 310.73 | 15.84 | 24.16 | 1 | 85.4 | 16 |
| read-by-id | prisma | 1 | 402.96 | 12.14 | 12.83 | 4 | 107.3 | 4 |
| relation-summary-naive | jdbc | 1 | 16.87 | 276.1 | 279.77 | 201 | 80.4 | 23 |
| relation-summary-naive | prisma | 1 | 15.07 | 306.28 | 321.46 | 201 | 141.7 | 13 |
| relation-summary-optimized | jdbc | 1 | 203.75 | 24.93 | 25.78 | 2 | 89.2 | 23 |
| relation-summary-optimized | prisma | 1 | 381.17 | 12.96 | 13.25 | 2 | 142.1 | 13 |
| report-aggregation | jdbc | 1 | 192.16 | 37.61 | 38.36 | 1 | 80.9 | 23 |
| report-aggregation | prisma | 1 | 363.67 | 15.46 | 16.64 | 1 | 150.4 | 13 |
| transaction-write | jdbc | 1 | 269.17 | 16.53 | 16.76 | 5 | 95.7 | 23 |
| transaction-write | prisma | 1 | 282.16 | 16.81 | 17.6 | 7 | 149.8 | 13 |

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
