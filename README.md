# Prisma vs JDBC: laboratorio reproducible

English version: [README.en.md](README.en.md)

Comandos bilingues PowerShell/Bash: [docs/commands-es-en.md](docs/commands-es-en.md)

Assets visuales y capturas para el post: [docs/content-assets.md](docs/content-assets.md)

Laboratorio para comparar dos stacks reales contra el mismo PostgreSQL 16, el mismo dataset y los mismos casos de negocio:

- Node.js 24 LTS + TypeScript + Prisma 5.
- Spring Boot 3 + Java 21/25 LTS + JDBC directo con `JdbcTemplate`.

No es un benchmark de "quien gana". Mide costo de abstraccion y tradeoffs observables: shape de queries, N+1, latencia, throughput util, memoria aproximada, cantidad de SQL ejecutado, transacciones y ergonomia.

## Requisitos

- Docker Desktop con Docker Compose.
- Node.js 24 LTS con Corepack/pnpm.
- Java 21 LTS y/o Java 25 LTS.
- Maven 3.9+.
- PowerShell 7 recomendado.

PostgreSQL se expone por default en `localhost:55432` para evitar chocar con instalaciones locales. Puedes cambiarlo con:

```powershell
$env:LAB_DB_PORT = "5433"
```

Durante `scripts/run-lab.ps1`, las APIs locales usan `127.0.0.1:3101` para Prisma y `127.0.0.1:3102` para JDBC. Puedes cambiarlas con `LAB_PRISMA_PORT` y `LAB_JDBC_PORT`.

## Estructura

- `docker-compose.yml`: PostgreSQL 16 con `pg_stat_statements`, mas servicios dockerizables.
- `apps/prisma-client`: API Fastify + Prisma.
- `apps/jdbc-service`: API Spring Boot + JdbcTemplate.
- `scripts/run-lab.ps1`: orquesta build, seed, servicios y runner.
- `scripts/compare-results.ps1`: genera `results/comparison.csv` y `results/comparison.md`.
- `docs/brief-post.md`: brief editorial para el post.

## Dataset

Tablas:

- `organizations`
- `users`
- `projects`
- `tasks`
- `comments`
- `audit_events`

El seed es deterministico: IDs UUID predecibles, fechas desde `2024-01-01`, datos sinteticos y sin informacion personal real.

Tamanos:

- `small`: 1k tasks.
- `medium` / `editorial`: 50k tasks.
- `large`: 200k tasks, opcional segun maquina.

## Smoke

```powershell
.\scripts\run-lab.ps1 -Mode smoke -Size small
```

Bash:

```bash
bash scripts/run-lab.sh --mode smoke --size small
```

Esto ejecuta:

- `docker compose config --quiet`
- PostgreSQL 16.
- `pnpm install`
- `npx prisma generate`
- `pnpm build`
- `pnpm test`
- `npx prisma db push`
- seed `small`
- `mvn test`
- `mvn package`
- corrida HTTP con warmup.
- generacion de `results/comparison.csv` y `results/comparison.md`.

## Corrida editorial

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

Bash:

```bash
bash scripts/run-lab.sh --mode editorial --size editorial --runs 3 --requests 300 --warmup 30 --concurrency 16
```

La corrida editorial esta preparada para 3 repeticiones por escenario. Si la maquina local no soporta el volumen, baja `-Concurrency` o `-Requests`, pero no mezcles esos resultados con una corrida editorial sin documentarlo.

## Matriz Java 21 vs 25

Para medir sensibilidad de JVM sin mezclar resultados:

```powershell
.\scripts\run-java-matrix.ps1 -Mode smoke -Size small
```

Para una corrida editorial completa:

```powershell
.\scripts\run-java-matrix.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

La matriz usa el mismo codigo y conserva bytecode compatible con Java 21. Eso permite ejecutar el mismo servicio sobre JVM 21 y JVM 25. Los resultados se copian a `results/matrix/`.

Tambien hay una matriz ampliada de runtimes en `docs/runtime-version-matrix.md`, con scripts para Java 21/22/25 y Node 20/22/24/25. Usala como sensibilidad metodologica, no como benchmark central.

## Casos medidos

- `read-by-id`: obtiene una task por id con organization/project/user basico.
- `paginated-list`: lista tasks filtradas por status, project y created_at.
- `relation-summary-naive` y `relation-summary-optimized`: resumen para 100 projects con conteos y ultimo comentario.
- `n-plus-one-trap-naive` y `n-plus-one-trap-optimized`: version mala y version corregida en ambos stacks.
- `transaction-write`: crea task + comment + audit_event dentro de transaccion.
- `report-aggregation`: dashboard SQL agregacional por organization/status/dia.

## Metricas

`results/comparison.csv` incluye:

- `total_requests`
- `successful_requests`
- `error_rate`
- `successful_requests_per_second`
- `p50_ms`
- `p95_ms`
- `p99_ms`
- `successful_p95_ms`
- `successful_p99_ms`
- `sql_query_count`
- `avg_sql_queries_per_successful_request`
- `app_rss_mb`
- `db_connections_used`
- `notes`

`sql_query_count` se instrumenta desde cada aplicacion. `pg_stat_statements` queda activado para inspeccion manual, pero no se usa como unica fuente porque resetear y atribuir por escenario puede inducir errores si hay conexiones auxiliares.

## Interpretacion

La comparacion mas util no es Prisma vs JDBC en abstracto. Es:

- naive vs optimized dentro de Prisma.
- naive vs optimized dentro de JDBC.
- ORM ergonomico vs SQL explicito cuando el shape del dato lo exige.
- costo de transaccion completa HTTP + driver + pool + DB.

No publiques numeros absolutos como verdad universal. Publica el contexto: CPU, OS, Docker, Node, Java, parametros de runner y tamano del dataset. Si usas la matriz Java, presenta Java 21 vs 25 como sensibilidad de runtime, no como parte central del argumento Prisma vs JDBC.

## Limitaciones

- El runner propio usa HTTP y `fetch`; no reemplaza un banco profesional como k6.
- RSS de Java se aproxima con heap + non-heap reportado por la JVM, no RSS nativo del proceso.
- Las apps corren localmente por default durante `run-lab.ps1`; Docker Compose tambien puede construirlas para inspeccion.
- El pool, GC, plan cache, antivirus, carga del host y recursos asignados a Docker pueden cambiar los numeros.

## Limpieza

```powershell
docker compose down
```

Para borrar volumenes y recrear PostgreSQL desde cero:

```powershell
docker compose down -v
```

Para borrar resultados generados:

```powershell
Remove-Item results\comparison.csv, results\comparison.md, results\raw\latest.json -ErrorAction SilentlyContinue
```
