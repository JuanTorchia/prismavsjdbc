# Resultados comparativos

Generado: 05/15/2026 18:03:04

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v24.11.1
- Java: openjdk version "25.0.2" 2026-01-20 LTS
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
| n-plus-one-trap-naive | jdbc | 3 | 15.22 | 1669.45 | 2007.77 | 301 | 100.8 | 23 |
| n-plus-one-trap-naive | prisma | 3 | 24.68 | 992.57 | 1169.66 | 103.03 | 333.1 | 23 |
| n-plus-one-trap-optimized | jdbc | 3 | 416.4 | 73.5 | 96.37 | 2 | 87.5 | 23 |
| n-plus-one-trap-optimized | prisma | 3 | 168.24 | 166.15 | 193.73 | 4 | 333.1 | 23 |
| paginated-list | jdbc | 3 | 527.66 | 66.11 | 79.72 | 1 | 102.8 | 23 |
| paginated-list | prisma | 3 | 656.35 | 49.26 | 77.72 | 1 | 190.2 | 23 |
| read-by-id | jdbc | 3 | 576.44 | 67.46 | 87.16 | 1 | 99.2 | 23 |
| read-by-id | prisma | 3 | 440.02 | 64.69 | 74.76 | 4.01 | 187.9 | 23 |
| relation-summary-naive | jdbc | 3 | 3.51 | 6871.92 | 7978 | 201 | 108.2 | 23 |
| relation-summary-naive | prisma | 3 | 3.41 | 5674.21 | 5965.66 | 201.24 | 315.8 | 23 |
| relation-summary-optimized | jdbc | 3 | 31.36 | 967.27 | 1336.12 | 2 | 103.2 | 23 |
| relation-summary-optimized | prisma | 3 | 32.67 | 750.03 | 867.29 | 2.04 | 314.8 | 23 |
| report-aggregation | jdbc | 3 | 119.74 | 211.81 | 250.16 | 1 | 87.9 | 23 |
| report-aggregation | prisma | 3 | 122.34 | 209.76 | 266.03 | 1.01 | 333 | 23 |
| transaction-write | jdbc | 3 | 366.81 | 95.57 | 119.93 | 5 | 95.5 | 23 |
| transaction-write | prisma | 3 | 267.58 | 104.7 | 124.97 | 7 | 333 | 23 |

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
