# Brief editorial

## Tesis principal

Comparar Prisma ORM y JDBC directo no deberia reducirse a "quien gana". El resultado defendible es que el costo de abstraccion depende del shape de la consulta, de si el codigo cae en N+1, de cuanto SQL explicito acepta el equipo y de como se mide la transaccion completa.

Esta iteracion agrega una capa `naive` / `idiomatic` / `best-effort` para responder una critica razonable: no basta comparar una implementacion ORM comoda contra SQL manual si tambien existe una forma Prisma mas ajustada, como `select` minimo o `$queryRaw` para shapes agregacionales.

## Que cambio en esta iteracion

- `results/comparison.csv` y `results/comparison.md` ahora incluyen la columna `level`.
- `read-by-id` mantiene Prisma `include` como idiomatic y agrega `read-by-id-best-effort` con `$queryRaw` y join equivalente al shape JDBC.
- `n-plus-one-trap` distingue `naive`, `idiomatic` y `best-effort`; Prisma idiomatic usa `include/_count`, y best-effort usa SQL explicito.
- `relation-summary-best-effort` y `report-aggregation-best-effort` quedan marcados como SQL explicito porque el shape es agregacional.
- Se agregan assets `level-improvement.svg` e `idiomatic-vs-best-effort.svg`.

## Criticas que responde

- "Estan midiendo Prisma usado de forma torpe": ahora hay variantes idiomaticas y best-effort donde tienen sentido.
- "JDBC tiene ventaja porque usa SQL manual": el laboratorio muestra tambien Prisma `$queryRaw` cuando el caso pide SQL explicito.
- "El include de read-by-id no representa el mejor Prisma posible": queda separado de la variante raw join.
- "Optimized no es lo mismo que idiomatic": el CSV lo modela como `level`, no como una etiqueta ambigua.

## Criticas que siguen siendo validas

- El runner propio HTTP no reemplaza k6 ni un benchmark profesional.
- RSS sigue siendo aproximado, especialmente en Java.
- Un solo hardware local no representa produccion.
- El pool, GC, Docker Desktop, antivirus, plan cache e indices pueden mover latencias absolutas.
- El codigo prioriza claridad editorial; no intenta micro-optimizar cada asignacion, mapper o serializacion.

## Variantes

| escenario | Prisma | JDBC | decision editorial |
|---|---|---|---|
| `read-by-id` | idiomatic `include/select` | join manual | Compara shapes elegidos, no una ley universal de Prisma. |
| `read-by-id-best-effort` | `$queryRaw` join minimo | mismo join mantenible | Sirve para responder la critica de fairness del include. |
| `paginated-list` | idiomatic `findMany` con filtros | SQL directo simple | No se agrego best-effort porque ambos ya son 1 SQL/request. |
| `relation-summary-naive` | N+1 deliberado | N+1 deliberado | Caso pedagogico, no recomendacion. |
| `relation-summary-best-effort` | `$queryRaw` | SQL equivalente | No hay version Prisma ORM exacta y mantenible para `last comment per project` sin caer en hacks o lecturas excesivas. |
| `n-plus-one-trap-naive` | consultas por task | consultas por task | Muestra el riesgo real de N+1. |
| `n-plus-one-trap-idiomatic` | `include/_count` | SQL join agregando comments | Implementacion normal y mantenible de cada stack. |
| `n-plus-one-trap-best-effort` | `$queryRaw` minimal | mismo SQL mantenible | Mide cuanto cambia Prisma cuando baja a SQL explicito. |
| `transaction-write` | `$transaction` | `@Transactional` | No se invento variante extra porque no mejoraba la comparacion sin cambiar el caso. |
| `report-aggregation-best-effort` | `$queryRaw` | SQL equivalente | Prisma `groupBy` no expresa limpiamente `date_trunc` + join por organization sin SQL raw. |

## Hallazgos defendibles

- El mismo dataset permite comparar implementaciones equivalentes sin mezclar diferencias de dominio.
- Naive vs idiomatic/best-effort dentro de cada stack explica mas que una tabla global Prisma vs JDBC.
- En `read-by-id`, Prisma idiomatic midio 4 SQL/request por el `include`; Prisma best-effort bajo a 1 SQL/request con `$queryRaw`.
- En `n-plus-one-trap`, Prisma idiomatic bajo fuerte respecto de naive, y best-effort bajo aun mas el conteo SQL/request.
- En consultas agregacionales y resumenes relacionales, SQL explicito hace visible el plan real y reduce queries cuando se disena bien.
- JDBC directo da control del SQL desde el inicio, pero tambien expone mas superficie manual: mapping, tipos, repeticion y costo de mantenimiento.

## Hallazgos que NO debemos afirmar

- "Java es mas rapido que Node".
- "JDBC siempre gana".
- "Prisma no sirve para produccion".
- "El ORM es el problema".
- "Estos p95 aplican a cualquier maquina o cloud".
- "El numero de queries explica todo el rendimiento".
- "Prisma siempre emite mas queries".
- "Prisma siempre emite mas SQL que JDBC".

## Frases prohibidas por ser demasiado fuertes

- "Prisma vs JDBC: el ganador definitivo".
- "Los ORMs son lentos".
- "JDBC es siempre la opcion correcta".
- "Node no puede competir con Java".
- "Este benchmark demuestra la verdad".
- "Prisma siempre emite mas SQL que JDBC".

## Angulo para espanol

"El problema no es usar ORM o no usarlo; el problema es no mirar el SQL que estas comprando con cada abstraccion."

## Angulo para ingles

"This is not a runtime shootout. It is a query-shape and abstraction-cost lab across two real stacks."

## Tabla de resultados principales

Fuente: corrida editorial local del `2026-05-15`, Node 24.11.1 LTS, Java 21.0.10 LTS, PostgreSQL 16, dataset de 50k tasks, 3 corridas, 300 requests medidos por corrida, concurrencia 16. Ver `results/comparison.md` para numeros completos.

| escenario | observacion principal | evidencia |
|---|---|---|
| read-by-id | Prisma idiomatic midio 4 SQL/request; Prisma/JDBC best-effort midieron 1 SQL/request con join explicito. | `results/comparison.csv` |
| paginated-list | Ambos stacks emitieron 1 SQL/request; no se agrego variante extra porque no aportaba fairness real. | `results/comparison.csv` |
| relation-summary | Naive quedo alrededor de 201 SQL/request; best-effort bajo a ~2 SQL/request con SQL equivalente. | `results/comparison.csv` |
| n-plus-one-trap | La version mala multiplico queries; idiomatic corrigio N+1 y best-effort mostro el techo razonable con SQL explicito. | `results/comparison.csv` |
| transaction-write | JDBC midio 5 SQL/request y Prisma 7 SQL/request en esta implementacion; no aisla solo costo de transaccion DB. | `results/comparison.csv` |
| report-aggregation | Ambos usan SQL explicito/agregacional; este escenario apoya la tesis de controlar SQL cuando el resultado es dashboard/reporting. | `results/comparison.csv` |

## Recomendacion de titulo ES

"Prisma vs JDBC sin humo: cuando el shape de la query pesa mas que el stack"

## Recomendacion de titulo EN

"Prisma vs JDBC Without the Hype: Query Shape Beats Runtime Narratives"

## Repo/commit final para citar

```text
repo: https://github.com/JuanTorchia/prismavsjdbc
baseline anterior: 5f6111d1458f382c1e01a0175fde52982a6bbf3b (tag baseline-editorial-final)
iteracion best-effort: tag best-effort-editorial-final
```
