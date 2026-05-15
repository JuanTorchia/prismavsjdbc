# Matriz de versiones de runtime

## Objetivo

Agregar una prueba de sensibilidad sin convertir el post en una comparacion de runtimes. La tesis principal sigue siendo query shape, N+1 y SQL/request.

## Versiones detectadas

Java:

- Java 21.0.10 LTS
- Java 22.0.2
- Java 25.0.2 LTS

Node:

- Node 20.18.0
- Node 22.17.1
- Node 24.11.1 LTS, baseline recomendado
- Node 25.2.1, Current/no-LTS

## Scripts

Java:

```powershell
.\scripts\run-java-matrix.ps1 -Mode smoke -Size small -SkipBuild
.\scripts\compare-java-matrix.ps1 -Mode smoke -OutputPath results/matrix/java-matrix-smoke-summary.md
```

Node:

```powershell
.\scripts\run-node-matrix.ps1 -Mode smoke -Size small -JavaHome 'C:\Users\jstor\scoop\apps\temurin25-jdk\current' -SkipBuild
.\scripts\compare-node-matrix.ps1 -Mode smoke
```

## Resultado smoke

Todas las versiones probadas completaron 16 filas de escenario con 0 filas fallidas:

- Java 21/22/25: OK.
- Node 20/22/24/25: OK.

Node 20, 22 y 25 muestran warning de `engines` porque el baseline declarado del proyecto es Node 24 LTS. Eso no invalida el smoke, pero si invalida usar esas versiones como baseline editorial sin aclaracion.

## Interpretacion

Smoke sirve para detectar compatibilidad y diferencias obvias, no para publicar performance. Los numeros smoke son sensibles a cold start, JIT, caches y volumen chico.

Estas matrices son anexos de sensibilidad. No deben mezclarse con `results/comparison.csv` ni con la tabla principal del post.

Para publicar una seccion de versiones:

- Java editorial recomendado: 21 vs 25 LTS. Java 22 puede quedar como nota historica/no-LTS.
- Node editorial recomendado: 22 vs 24 LTS si interesa compatibilidad historica, y 25 solo como Current/no-LTS.
- No correr matriz factorial Java x Node salvo que el post pase a ser de runtimes. Seria caro y menos claro.

## Frase editorial sugerida

"Probamos tambien varias versiones de Java y Node. El resultado importante no fue encontrar un ganador de runtime, sino verificar que los hallazgos de N+1 y SQL/request seguian siendo visibles al cambiar la VM."
