# Resultados comparativos

Generado: 05/15/2026 18:09:41

## Entorno

- OS: Windows_NT 10.0.26100 x64
- CPU: Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz (6 logical CPUs)
- Node: v22.17.1
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
| n-plus-one-trap-naive | jdbc | 1 | 11.17 | 435.73 | 441.24 | 301 | 83.1 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 33.33 | 153.88 | 193.24 | 103 | 153.4 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 242.74 | 30.99 | 32.28 | 2 | 87.5 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 201.17 | 23.17 | 25.39 | 4 | 153.8 | 13 |
| paginated-list | jdbc | 1 | 229.03 | 27.62 | 32.37 | 1 | 89.8 | 18 |
| paginated-list | prisma | 1 | 904.16 | 5.01 | 5.49 | 1 | 117.5 | 4 |
| read-by-id | jdbc | 1 | 322.2 | 16.35 | 30.87 | 1 | 84.7 | 16 |
| read-by-id | prisma | 1 | 514.5 | 10.1 | 11.2 | 4 | 117.2 | 4 |
| relation-summary-naive | jdbc | 1 | 17.53 | 249.67 | 254.24 | 201 | 80.5 | 23 |
| relation-summary-naive | prisma | 1 | 16.09 | 275.71 | 318.35 | 201 | 148.2 | 13 |
| relation-summary-optimized | jdbc | 1 | 190.33 | 25.32 | 30.51 | 2 | 85.2 | 23 |
| relation-summary-optimized | prisma | 1 | 376.24 | 11.9 | 12.85 | 2 | 148.9 | 13 |
| report-aggregation | jdbc | 1 | 182.53 | 31.41 | 33.22 | 1 | 76 | 23 |
| report-aggregation | prisma | 1 | 395.46 | 11.64 | 17.81 | 1 | 154 | 13 |
| transaction-write | jdbc | 1 | 233.19 | 20.07 | 22.36 | 5 | 92.1 | 23 |
| transaction-write | prisma | 1 | 246.58 | 17.83 | 20.33 | 7 | 154.4 | 13 |

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
