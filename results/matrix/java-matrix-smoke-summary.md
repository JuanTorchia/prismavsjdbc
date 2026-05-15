# Matriz Java

Modo: `smoke`

Interpretacion / Interpretation: sensibilidad de JVM para JDBC. This is runtime sensitivity for JDBC, not the central Prisma vs JDBC claim.

| java | scenario | p95 ms | delta p95 vs Java 21 % | rps | delta rps vs Java 21 % | SQL/request |
|---|---|---:|---:|---:|---:|---:|
| java-21 | n-plus-one-trap-naive | 522.42 | 0 | 10.09 | 0 | 301 |
| java-22 | n-plus-one-trap-naive | 463.07 | -11.36 | 11.72 | 16.15 | 301 |
| java-25 | n-plus-one-trap-naive | 441.75 | -15.44 | 10.17 | 0.79 | 301 |
| java-21 | n-plus-one-trap-optimized | 21.02 | 0 | 294.76 | 0 | 2 |
| java-22 | n-plus-one-trap-optimized | 14.19 | -32.49 | 308.1 | 4.53 | 2 |
| java-25 | n-plus-one-trap-optimized | 77.94 | 270.79 | 105.53 | -64.2 | 2 |
| java-21 | paginated-list | 22.99 | 0 | 228.08 | 0 | 1 |
| java-22 | paginated-list | 28.18 | 22.58 | 237.12 | 3.96 | 1 |
| java-25 | paginated-list | 25.35 | 10.27 | 228.6 | 0.23 | 1 |
| java-21 | read-by-id | 17.47 | 0 | 328.2 | 0 | 1 |
| java-22 | read-by-id | 17.14 | -1.89 | 339.21 | 3.35 | 1 |
| java-25 | read-by-id | 22.89 | 31.02 | 257.91 | -21.42 | 1 |
| java-21 | relation-summary-naive | 288.52 | 0 | 15.73 | 0 | 201 |
| java-22 | relation-summary-naive | 271.28 | -5.98 | 16.64 | 5.79 | 201 |
| java-25 | relation-summary-naive | 691.57 | 139.7 | 9.14 | -41.89 | 201 |
| java-21 | relation-summary-optimized | 41.16 | 0 | 177.09 | 0 | 2 |
| java-22 | relation-summary-optimized | 30.46 | -26 | 176.07 | -0.58 | 2 |
| java-25 | relation-summary-optimized | 61.91 | 50.41 | 91.98 | -48.06 | 2 |
| java-21 | report-aggregation | 28.21 | 0 | 216.47 | 0 | 1 |
| java-22 | report-aggregation | 38.14 | 35.2 | 182.68 | -15.61 | 1 |
| java-25 | report-aggregation | 77.09 | 173.27 | 83.97 | -61.21 | 1 |
| java-21 | transaction-write | 37.47 | 0 | 158.27 | 0 | 5 |
| java-22 | transaction-write | 48.72 | 30.02 | 101.54 | -35.84 | 5 |
| java-25 | transaction-write | 163.73 | 336.96 | 44.98 | -71.58 | 5 |

## Nota / Note

- ES: usar como sensibilidad metodologica, no como benchmark central.
- EN: use as methodology sensitivity, not as the central benchmark.
