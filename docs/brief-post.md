# Brief editorial

## Tesis principal

Comparar Prisma ORM y JDBC directo no deberia reducirse a "quien gana". El resultado defendible es que el costo de abstraccion depende del shape de la consulta, de si el codigo cae en N+1, de cuanto SQL explicito acepta el equipo y de como se mide la transaccion completa.

## Hallazgos defendibles

- El mismo dataset permite comparar implementaciones equivalentes sin mezclar diferencias de dominio.
- Los escenarios naive vs optimized muestran mejor el tradeoff que una tabla global Prisma vs JDBC.
- En consultas agregacionales y resumenes relacionales, SQL explicito tiende a hacer visible el plan real y reduce queries cuando se disena bien.
- Prisma puede expresar casos CRUD y relaciones con buena ergonomia, pero hay que observar cuantas queries emite y cuando conviene bajar a SQL.
- JDBC directo da control del SQL desde el inicio, pero tambien expone mas superficie manual: mapping, tipos, repeticion y riesgo de errores humanos.
- `read-by-id` no prueba que Prisma "siempre emite mas queries": compara el shape elegido en esta implementacion, Prisma `include` contra JDBC con join manual.

## Hallazgos que NO debemos afirmar

- "Java es mas rapido que Node".
- "JDBC siempre gana".
- "Prisma no sirve para produccion".
- "El ORM es el problema".
- "Estos p95 aplican a cualquier maquina o cloud".
- "El numero de queries explica todo el rendimiento".
- "Prisma siempre emite mas queries".

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

Fuente: corrida editorial local del `2026-05-15`, dataset de 50k tasks, 3 corridas, 300 requests medidos por corrida, concurrencia 16. Ver `results/comparison.md` para numeros completos.

| escenario | observacion principal | evidencia |
|---|---|---|
| read-by-id | JDBC emitio 1 SQL/request; Prisma emitio 4 SQL/request por el include relacional. La diferencia relevante es shape de query, no "lenguaje". | `results/comparison.csv` |
| paginated-list | Ambos stacks emitieron 1 SQL/request y quedaron en el mismo orden de magnitud de latencia. | `results/comparison.csv` |
| relation-summary | El naive fue dramaticamente peor en ambos stacks, con ~201 SQL/request. La version optimizada bajo a ~2 SQL/request. | `results/comparison.csv` |
| n-plus-one-trap | La version mala multiplico queries; la version optimizada redujo SQL/request y latencia en ambos stacks. | `results/comparison.csv` |
| transaction-write | JDBC midio 5 SQL/request y Prisma 7 SQL/request en esta implementacion; no aisla solo costo de transaccion DB. | `results/comparison.csv` |
| report-aggregation | Ambos usan SQL explicito/agregacional y quedan cerca; este escenario apoya la tesis de controlar el SQL cuando el resultado es dashboard/reporting. | `results/comparison.csv` |

## Recomendacion de titulo ES

"Prisma vs JDBC sin humo: midiendo el costo real de la abstraccion"

## Recomendacion de titulo EN

"Prisma vs JDBC Without the Hype: Measuring the Real Cost of Abstraction"

## Repo/commit final para citar

Completar despues de commit:

```text
repo: https://github.com/JuanTorchia/prismavsjdbc
commit: ver tag baseline-editorial-final y commit final publicado
```
