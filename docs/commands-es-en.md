# Comandos / Commands

## Espanol

### Smoke

Windows PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode smoke -Size small
```

Bash:

```bash
bash scripts/run-lab.sh --mode smoke --size small
```

### Editorial

Windows PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

Si `java -version` no es Java 21:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16 -JavaHome 'C:\Users\jstor\scoop\apps\temurin21-jdk\current'
```

Bash:

```bash
bash scripts/run-lab.sh --mode editorial --size editorial --runs 3 --requests 300 --warmup 30 --concurrency 16
```

### Seed

Windows PowerShell:

```powershell
.\scripts\seed.ps1 -Size small
```

Bash:

```bash
bash scripts/seed.sh small
```

### Regenerar resultados

Windows PowerShell:

```powershell
.\scripts\compare-results.ps1
```

Bash:

```bash
bash scripts/compare-results.sh
```

Para generar Markdown en ingles:

```powershell
$env:LAB_LANG = "en"; .\scripts\compare-results.ps1
```

```bash
LAB_LANG=en bash scripts/compare-results.sh
```

### Matriz Java

Windows PowerShell:

```powershell
.\scripts\run-java-matrix.ps1 -Mode smoke -Size small -SkipBuild
.\scripts\compare-java-matrix.ps1 -Mode smoke -OutputPath results/matrix/java-matrix-smoke-summary.md
```

Bash:

```bash
export JAVA21_HOME=/path/to/jdk-21
export JAVA22_HOME=/path/to/jdk-22
export JAVA25_HOME=/path/to/jdk-25
bash scripts/run-java-matrix.sh --mode smoke --size small --skip-build
MODE=smoke OUTPUT_PATH=results/matrix/java-matrix-smoke-summary.md bash scripts/compare-java-matrix.sh
```

### Matriz Node

Windows PowerShell:

```powershell
.\scripts\run-node-matrix.ps1 -Mode smoke -Size small -JavaHome 'C:\Users\jstor\scoop\apps\temurin25-jdk\current' -SkipBuild
.\scripts\compare-node-matrix.ps1 -Mode smoke
```

Bash:

```bash
bash scripts/run-node-matrix.sh --mode smoke --size small --java-home /path/to/jdk-25 --skip-build
MODE=smoke bash scripts/compare-node-matrix.sh
```

En Bash, la matriz Node requiere `nvm`.

## English

### Smoke

Windows PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode smoke -Size small
```

Bash:

```bash
bash scripts/run-lab.sh --mode smoke --size small
```

### Editorial Run

Windows PowerShell:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16
```

If `java -version` is not Java 21:

```powershell
.\scripts\run-lab.ps1 -Mode editorial -Size editorial -Runs 3 -Requests 300 -Warmup 30 -Concurrency 16 -JavaHome 'C:\Users\jstor\scoop\apps\temurin21-jdk\current'
```

Bash:

```bash
bash scripts/run-lab.sh --mode editorial --size editorial --runs 3 --requests 300 --warmup 30 --concurrency 16
```

### Seed

Windows PowerShell:

```powershell
.\scripts\seed.ps1 -Size small
```

Bash:

```bash
bash scripts/seed.sh small
```

### Regenerate Results

Windows PowerShell:

```powershell
$env:LAB_LANG = "en"; .\scripts\compare-results.ps1
```

Bash:

```bash
LAB_LANG=en bash scripts/compare-results.sh
```

### Java Matrix

Windows PowerShell:

```powershell
.\scripts\run-java-matrix.ps1 -Mode smoke -Size small -SkipBuild
.\scripts\compare-java-matrix.ps1 -Mode smoke -OutputPath results/matrix/java-matrix-smoke-summary.md
```

Bash:

```bash
export JAVA21_HOME=/path/to/jdk-21
export JAVA22_HOME=/path/to/jdk-22
export JAVA25_HOME=/path/to/jdk-25
bash scripts/run-java-matrix.sh --mode smoke --size small --skip-build
MODE=smoke OUTPUT_PATH=results/matrix/java-matrix-smoke-summary.md bash scripts/compare-java-matrix.sh
```

### Node Matrix

Windows PowerShell:

```powershell
.\scripts\run-node-matrix.ps1 -Mode smoke -Size small -JavaHome 'C:\Users\jstor\scoop\apps\temurin25-jdk\current' -SkipBuild
.\scripts\compare-node-matrix.ps1 -Mode smoke
```

Bash:

```bash
bash scripts/run-node-matrix.sh --mode smoke --size small --java-home /path/to/jdk-25 --skip-build
MODE=smoke bash scripts/compare-node-matrix.sh
```

On Bash, the Node matrix requires `nvm`.
