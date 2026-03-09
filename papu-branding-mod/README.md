# papu-branding-mod

Mod Fabric cliente que reemplaza el menu principal vanilla por un menu estilo PapuClient (oscuro/rosado).

## Version objetivo
- Minecraft: `1.21.1`
- Fabric Loader: `0.16.x+`
- Java: `21`

## Compilar
Si tienes Gradle instalado:
```bash
gradle build
```

Si no tienes Gradle, genera wrapper una vez:
```bash
gradle wrapper
.\\gradlew build
```

Jar resultante:
- `build/libs/papu-branding-mod-0.1.0.jar`

## Probar rapido
1. Copia el jar a la carpeta `mods` de la instancia Fabric.
2. Inicia Minecraft desde PapuClient.
3. Veras el menu custom en vez del titulo vanilla.

## Botones implementados
- Singleplayer
- Multiplayer
- Options
- Quit Game
