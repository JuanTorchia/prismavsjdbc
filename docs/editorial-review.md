# Revision editorial por 3 expertos

Objetivo: mejorar el post antes de publicarlo, anticipando objeciones tecnicas y editoriales. Estos perfiles no son endorsements reales; son roles de revision para endurecer el argumento.

## 1. Arquitecta backend pragmatica

**Rol**

Staff/Principal Backend Engineer con experiencia operando APIs transaccionales en Java, Node y PostgreSQL. Le interesan decisiones de arquitectura que sobreviven produccion, no microbenchmarks.

**Idea que podria interesarle**

"La pregunta correcta no es Prisma vs JDBC, sino cuanto control del SQL necesita cada caso de negocio y que costo paga el equipo cuando no mira el query shape."

**Que va a valorar**

- El mismo dataset y los mismos casos de negocio para ambos stacks.
- La separacion naive vs optimized dentro de cada tecnologia.
- La advertencia contra conclusiones universales.
- El caso `relation-summary`, porque muestra una decision de arquitectura real: API ergonomica vs SQL agregacional explicito.

**Critica probable**

- El laboratorio todavia mezcla costo HTTP, runtime, pool, driver y DB. Eso esta documentado, pero el post debe repetirlo cerca de cada tabla fuerte.
- `read-by-id` compara Prisma con includes que emiten 4 queries contra JDBC con un join manual. Es valido como "shape elegido", pero no como "Prisma intrinsicamente hace 4".
- Falta mostrar el codigo lado a lado para que el lector vea ergonomia y superficie de error.

**Mejoras sugeridas**

- Agregar una seccion "Mismo caso, distinto shape SQL" con snippets reducidos de Prisma y JDBC.
- Para cada resultado, anotar el numero de SQL/request antes de hablar de latencia.
- Evitar decir "JDBC gana en X"; decir "esta implementacion JDBC uso 1 query donde esta implementacion Prisma uso N".

## 2. Especialista PostgreSQL / performance

**Rol**

DBA o performance engineer enfocado en PostgreSQL, planes de ejecucion, indices, cardinalidad, pooling y mediciones reproducibles.

**Idea que podria interesarle**

"El numero de queries no explica todo, pero cuando explota por N+1, la discusion de runtime pasa a segundo plano."

**Que va a valorar**

- PostgreSQL 16 compartido.
- Dataset deterministico.
- Conteo de queries por aplicacion.
- `pg_stat_statements` activado, aunque no sea la fuente principal.

**Critica probable**

- Falta capturar `EXPLAIN (ANALYZE, BUFFERS)` para los escenarios agregacionales y los optimizados.
- `db_connections_used` reporta conexiones visibles, pero no demuestra saturacion ni uso efectivo del pool.
- La corrida no fija recursos Docker ni documenta memoria/CPU asignada a Docker Desktop.
- La version local de Java debe fijarse por corrida. Si el post compara Java 21 y Java 25, tiene que guardar resultados separados y no mezclar una unica tabla.

**Mejoras sugeridas**

- Agregar un anexo con `EXPLAIN` de `relation-summary-optimized`, `n-plus-one-trap-optimized` y `report-aggregation`.
- Documentar indices creados por Prisma y explicar por que alcanzan o no alcanzan.
- Incluir "Docker Desktop resources" en metodologia: CPUs, RAM, WSL/Hyper-V si aplica.
- Si el post final cita numeros, correr editorial con `scripts/run-java-matrix.ps1` o elegir una unica JVM y documentarla.

## 3. Editor tecnico para audiencia dev

**Rol**

Editor de contenido tecnico para lectores backend semi-senior/senior. Busca claridad narrativa, titulo honesto, tablas interpretables y frases que no generen peleas superficiales.

**Idea que podria interesarle**

"Un laboratorio contra slogans: cuando optimizas el shape, ambos stacks mejoran; cuando no, ambos te cobran."

**Que va a valorar**

- El angulo anti-hype.
- La tabla de "que NO se puede concluir".
- La tension entre ergonomia y control.
- El hecho de que los resultados no se presentan como verdad universal.

**Critica probable**

- El titulo actual es correcto, pero podria sonar defensivo. Falta una promesa mas concreta para el lector.
- La tabla principal tiene demasiadas metricas si aparece temprano; conviene abrir con 3 observaciones y mandar la tabla completa al anexo.
- Falta una conclusion accionable para equipos: cuando usar ORM felizmente, cuando revisar SQL, cuando escribir SQL explicito.

**Mejoras sugeridas**

- Estructura recomendada del post:
  1. La trampa: "Prisma vs JDBC" es la pregunta equivocada.
  2. Como armamos el laboratorio.
  3. Donde N+1 destruye ambos stacks.
  4. Donde el query shape explica mas que el runtime.
  5. Donde SQL explicito sigue siendo la herramienta correcta.
  6. Que decidiria en un equipo real.
  7. Limitaciones y repo.
- Abrir con un resultado fuerte pero no absolutista: "En esta corrida, pasar de naive a optimized cambio mas el resultado que cambiar de stack."
- Agregar una caja editorial: "Si solo te llevas una cosa: mide SQL/request antes de discutir ORM vs driver."

## Editoriales / espacios potencialmente interesados

No contactar con pitch generico. Conviene adaptar el enfoque:

| espacio | por que podria interesar | pitch recomendado |
|---|---|---|
| Blog tecnico personal / Medium / dev.to | Audiencia amplia, buena para version narrativa | "No es un benchmark: es una guia reproducible para evitar conclusiones falsas al comparar ORM y SQL directo." |
| InfoQ / DZone / Baeldung-style Java audience | Interesa Spring Boot, JDBC, performance y arquitectura | "Un laboratorio reproducible Spring JDBC vs Prisma que muestra N+1, query shape y limites metodologicos." |
| Prisma community / Node backend community | Puede interesar si no suena anti-Prisma | "Como medir Prisma de forma justa: SQL emitido, N+1, transacciones y cuando bajar a raw SQL." |
| PostgreSQL community / performance blogs | Interesa si se agregan EXPLAIN e indices | "El runtime no salva un mal shape: evidencia con PostgreSQL 16, query counts y escenarios relacionales." |

## Cambios prioritarios antes de publicar

1. Agregar snippets lado a lado para `read-by-id`, `relation-summary naive/optimized` y `transaction-write`.
2. Agregar anexo de `EXPLAIN` para las queries optimizadas.
3. Repetir explicitamente que `successful_requests_per_second` incluye HTTP/app/driver/pool/DB.
4. Normalizar entorno de Java para la corrida final: una unica JVM documentada o matriz Java 21 vs 25 separada.
5. Separar "resultado observado" de "decision practica" en el post final.

## Titulos alternativos

- ES: "Prisma vs JDBC: lo que cambia cuando miras las queries, no solo el p95"
- ES: "El costo real del ORM: un laboratorio Prisma vs JDBC sin ganador artificial"
- EN: "Prisma vs JDBC: What Changes When You Measure Query Shape"
- EN: "The Real Cost of Abstraction: A Reproducible Prisma vs JDBC Lab"
