# Paquete de contenido / Content Asset Pack

## Assets generados

Graficos SVG:

- `results/assets/p95-by-scenario.svg`
- `results/assets/sql-by-scenario.svg`
- `results/assets/n-plus-one-impact.svg`
- `results/assets/java-sensitivity-p95.svg`

Reportes HTML:

- `results/assets/report.es.html`
- `results/assets/report.en.html`

Capturas PNG:

- `results/assets/screenshots/report-full.png`
- `results/assets/screenshots/p95.png`
- `results/assets/screenshots/sql.png`
- `results/assets/screenshots/n1.png`
- `results/assets/screenshots/java-sensitivity-p95.png`

## Regenerar assets

PowerShell:

```powershell
.\scripts\generate-content-assets.ps1 -Lang es
.\scripts\generate-content-assets.ps1 -Lang en
```

Bash:

```bash
LAB_LANG=es bash scripts/generate-content-assets.sh
LAB_LANG=en bash scripts/generate-content-assets.sh
```

## Capturas

Opcion A: Playwright instalado en el proyecto:

```powershell
node scripts/capture-content-assets.mjs --input results/assets/report.es.html --out results/assets/screenshots
```

```bash
node scripts/capture-content-assets.mjs --input results/assets/report.es.html --out results/assets/screenshots
```

Opcion B: navegador manual:

```powershell
python -m http.server 4177 --bind 127.0.0.1 -d results/assets
```

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory results/assets
```

Abrir:

```text
http://127.0.0.1:4177/report.es.html
http://127.0.0.1:4177/report.en.html
```

## Pruebas adicionales recomendadas para mas contenido

1. **Cold vs warm JVM/Node**
   - Correr smoke dos veces seguidas sin rebuild.
   - Objetivo: mostrar cuanto mejora despues de caches/JIT.

2. **Concurrencia baja/media/alta**
   - `-Concurrency 1`, `8`, `32`.
   - Objetivo: ver cuando la cola HTTP/pool/DB empieza a dominar.

3. **Dataset medium vs large**
   - `small`, `editorial`, `large`.
   - Objetivo: separar overhead fijo de costo que escala con datos.

4. **EXPLAIN de queries optimizadas**
   - `relation-summary-optimized`
   - `n-plus-one-trap-optimized`
   - `report-aggregation`
   - Objetivo: darle solidez a lectores PostgreSQL.

5. **Version matrix como sensibilidad**
   - Java 21/22/25 smoke.
   - Node 20/22/24/25 smoke.
   - Objetivo: demostrar que el patron N+1/SQL-request no depende de una version puntual.

## Mensaje editorial

ES:

> Las capturas no prueban que un stack sea superior. Sirven para mostrar visualmente que el shape de queries y N+1 explican mas que una narrativa simple de runtime.

EN:

> The screenshots do not prove one stack is superior. They visually show that query shape and N+1 explain more than a simplistic runtime narrative.
