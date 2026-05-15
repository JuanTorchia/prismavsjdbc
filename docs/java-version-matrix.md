# Matriz Java 21 vs Java 25

## Decision editorial

La comparacion principal sigue siendo Prisma vs JDBC sobre el mismo problema de negocio. Java 21 vs Java 25 debe tratarse como una prueba de sensibilidad del runtime, no como el centro del post.

La tabla principal del post debe salir de `results/comparison.csv`. Los archivos bajo `results/matrix/` son anexos y no deben mezclarse con la evidencia principal.

## Por que comparar ambas

- Java 21 LTS es un baseline ampliamente usado en produccion.
- Java 25 LTS es la LTS mas nueva.
- Si los hallazgos N+1/query-shape se mantienen en ambas, el argumento editorial queda mas fuerte.
- Si cambian mucho, el post gana una advertencia metodologica importante: la JVM tambien forma parte del sistema medido.

## Como correr

Smoke:

```powershell
.\scripts\run-java-matrix.ps1 -Mode smoke -Size small
```

Editorial:

```powershell
.\scripts\run-java-matrix.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

## Que se compara exactamente

El servicio JDBC se compila con bytecode compatible con Java 21 y se ejecuta sobre JVM 21 y JVM 25. Esto evita cambiar codigo fuente, dependencias y bytecode a la vez.

Node queda fijado en Node 24 LTS para no mezclar dos matrices en la misma evidencia. Node 26 puede ser interesante como experimento, pero no es el mejor baseline editorial si todavia no es LTS.

## Como reportarlo

Resultado editorial generado en esta maquina con 50k tasks, 3 corridas, 300 requests medidos por corrida y concurrencia 16. Tabla completa en `results/matrix/java-matrix-summary.md`.

| escenario | Java 21 p95 | Java 25 p95 | diferencia | interpretacion |
|---|---:|---:|---:|---|
| read-by-id | 84.31 ms | 67.46 ms | -20.0% | Java 25 mejoro esta corrida, pero el shape siguio siendo 1 SQL/request. |
| relation-summary-optimized | 1039.44 ms | 967.27 ms | -6.9% | La mejora de JVM no cambia la conclusion principal: optimizar bajo de ~201 a 2 SQL/request. |
| n-plus-one-trap-optimized | 88.18 ms | 73.50 ms | -16.6% | Java 25 ayudo, pero el salto grande sigue viniendo de eliminar N+1. |
| transaction-write | 102.09 ms | 95.57 ms | -6.4% | Diferencia moderada; no aisla solo DB porque incluye HTTP, driver, pool y transaccion. |

No usar frases como "Java 25 es mas rapido" sin controlar GC, warmup JVM, flags, Docker resources y variabilidad.
