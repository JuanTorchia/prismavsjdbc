# Resultados comparativos

Generado: 05/15/2026 18:08:31

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
| n-plus-one-trap-naive | jdbc | 1 | 10.17 | 441.75 | 442.74 | 301 | 83.3 | 23 |
| n-plus-one-trap-naive | prisma | 1 | 20 | 319.73 | 361.51 | 103 | 189.2 | 13 |
| n-plus-one-trap-optimized | jdbc | 1 | 105.53 | 77.94 | 80.43 | 2 | 91.6 | 23 |
| n-plus-one-trap-optimized | prisma | 1 | 173.75 | 27.2 | 27.95 | 4 | 189.7 | 13 |
| paginated-list | jdbc | 1 | 228.6 | 25.35 | 25.58 | 1 | 90.5 | 18 |
| paginated-list | prisma | 1 | 576.77 | 9.81 | 10.24 | 1 | 125.2 | 4 |
| read-by-id | jdbc | 1 | 257.91 | 22.89 | 25.87 | 1 | 85.5 | 16 |
| read-by-id | prisma | 1 | 351.13 | 14.1 | 20.36 | 4 | 124.9 | 4 |
| relation-summary-naive | jdbc | 1 | 9.14 | 691.57 | 721.17 | 201 | 81.3 | 23 |
| relation-summary-naive | prisma | 1 | 11.03 | 492.16 | 527.45 | 201 | 159.6 | 13 |
| relation-summary-optimized | jdbc | 1 | 91.98 | 61.91 | 70.98 | 2 | 90 | 23 |
| relation-summary-optimized | prisma | 1 | 381.03 | 11.34 | 13.85 | 2 | 159.9 | 13 |
| report-aggregation | jdbc | 1 | 83.97 | 77.09 | 102.87 | 1 | 80.8 | 23 |
| report-aggregation | prisma | 1 | 238.86 | 18.05 | 32.72 | 1 | 190.6 | 13 |
| transaction-write | jdbc | 1 | 44.98 | 163.73 | 179.75 | 5 | 92.2 | 23 |
| transaction-write | prisma | 1 | 185.6 | 30.07 | 33.24 | 7 | 189.5 | 13 |

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
