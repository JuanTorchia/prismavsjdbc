# Matriz Node

Modo: `smoke`

Interpretacion / Interpretation: sensibilidad del runtime Node para Prisma. Node runtime sensitivity for Prisma; Node 24 LTS is the editorial baseline.

| node | scenario | p95 ms | delta p95 vs Node 24 % | rps | delta rps vs Node 24 % | SQL/request |
|---|---|---:|---:|---:|---:|---:|
| node-20.18.0 | n-plus-one-trap-naive | 135.57 | -14.05 | 31.94 | 12.94 | 103 |
| node-22.17.1 | n-plus-one-trap-naive | 153.88 | -2.44 | 33.33 | 17.86 | 103 |
| node-24.11.1 | n-plus-one-trap-naive | 157.73 | 0 | 28.28 | 0 | 103 |
| node-25.2.1 | n-plus-one-trap-naive | 134.83 | -14.52 | 34.51 | 22.03 | 103 |
| node-20.18.0 | n-plus-one-trap-optimized | 29 | -56.42 | 162.63 | 77.99 | 4 |
| node-22.17.1 | n-plus-one-trap-optimized | 23.17 | -65.18 | 201.17 | 120.17 | 4 |
| node-24.11.1 | n-plus-one-trap-optimized | 66.54 | 0 | 91.37 | 0 | 4 |
| node-25.2.1 | n-plus-one-trap-optimized | 21.65 | -67.46 | 224.34 | 145.53 | 4 |
| node-20.18.0 | paginated-list | 5.38 | -21.8 | 848.87 | 20.47 | 1 |
| node-22.17.1 | paginated-list | 5.01 | -27.18 | 904.16 | 28.32 | 1 |
| node-24.11.1 | paginated-list | 6.88 | 0 | 704.63 | 0 | 1 |
| node-25.2.1 | paginated-list | 4.57 | -33.58 | 950.95 | 34.96 | 1 |
| node-20.18.0 | read-by-id | 12.14 | 40.51 | 402.96 | -28.26 | 4 |
| node-22.17.1 | read-by-id | 10.1 | 16.9 | 514.5 | -8.41 | 4 |
| node-24.11.1 | read-by-id | 8.64 | 0 | 561.72 | 0 | 4 |
| node-25.2.1 | read-by-id | 7.45 | -13.77 | 672.86 | 19.79 | 4 |
| node-20.18.0 | relation-summary-naive | 306.28 | -2.2 | 15.07 | -0.92 | 201 |
| node-22.17.1 | relation-summary-naive | 275.71 | -11.96 | 16.09 | 5.79 | 201 |
| node-24.11.1 | relation-summary-naive | 313.17 | 0 | 15.21 | 0 | 201 |
| node-25.2.1 | relation-summary-naive | 320.27 | 2.27 | 14.99 | -1.45 | 201 |
| node-20.18.0 | relation-summary-optimized | 12.96 | 16.23 | 381.17 | -5.5 | 2 |
| node-22.17.1 | relation-summary-optimized | 11.9 | 6.73 | 376.24 | -6.73 | 2 |
| node-24.11.1 | relation-summary-optimized | 11.15 | 0 | 403.37 | 0 | 2 |
| node-25.2.1 | relation-summary-optimized | 20.85 | 87 | 249.16 | -38.23 | 2 |
| node-20.18.0 | report-aggregation | 15.46 | 35.5 | 363.67 | -17.03 | 1 |
| node-22.17.1 | report-aggregation | 11.64 | 2.02 | 395.46 | -9.78 | 1 |
| node-24.11.1 | report-aggregation | 11.41 | 0 | 438.32 | 0 | 1 |
| node-25.2.1 | report-aggregation | 12.45 | 9.11 | 449.32 | 2.51 | 1 |
| node-20.18.0 | transaction-write | 16.81 | -55.76 | 282.16 | 35.1 | 7 |
| node-22.17.1 | transaction-write | 17.83 | -53.08 | 246.58 | 18.06 | 7 |
| node-24.11.1 | transaction-write | 38 | 0 | 208.86 | 0 | 7 |
| node-25.2.1 | transaction-write | 15.53 | -59.13 | 305.69 | 46.36 | 7 |

## Nota / Note

- ES: Node 25 es Current/no-LTS; no usar como baseline sin aclararlo.
- EN: Node 25 is Current/non-LTS; do not use it as a baseline without saying so.
