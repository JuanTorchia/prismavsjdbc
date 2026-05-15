# Matriz Java 21 vs Java 25

Modo: `editorial`

Interpretacion: esta tabla mide sensibilidad de la JVM para el servicio JDBC y mantiene Node/Prisma como contexto de la corrida completa. No convierte el post en Java 21 vs Java 25.

## JDBC

| scenario | Java 21 p95 | Java 25 p95 | delta p95 % | Java 21 rps | Java 25 rps | delta rps % | SQL/request |
|---|---:|---:|---:|---:|---:|---:|---:|
| n-plus-one-trap-naive | 1813.7 | 1669.45 | -8 | 13.77 | 15.22 | 10.5 | 301 |
| n-plus-one-trap-optimized | 88.18 | 73.5 | -16.6 | 356.6 | 416.4 | 16.8 | 2 |
| paginated-list | 72.52 | 66.11 | -8.8 | 506.01 | 527.66 | 4.3 | 1 |
| read-by-id | 84.31 | 67.46 | -20 | 535.81 | 576.44 | 7.6 | 1 |
| relation-summary-naive | 8135.78 | 6871.92 | -15.5 | 3.21 | 3.51 | 9.3 | 201 |
| relation-summary-optimized | 1039.44 | 967.27 | -6.9 | 27.31 | 31.36 | 14.8 | 2 |
| report-aggregation | 232.96 | 211.81 | -9.1 | 114.01 | 119.74 | 5 | 1 |
| transaction-write | 102.09 | 95.57 | -6.4 | 286.22 | 366.81 | 28.2 | 5 |

## Nota metodologica

- El bytecode se mantiene compatible con Java 21 para poder ejecutar el mismo artefacto sobre JVM 21 y JVM 25.
- Los escenarios Prisma aparecen en los CSV porque la corrida completa conserva ambos stacks, pero esta matriz solo debe usarse para discutir sensibilidad del servicio JDBC.
- Diferencias pequenas no justifican claims fuertes; diferencias grandes requieren revisar GC, warmup, CPU disponible y variabilidad de Docker/host.
