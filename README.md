# PapuClient (MVP)

Base inicial para un cliente estilo launcher de Minecraft con:
- Login Microsoft (cuenta comprada)
- Descarga/uso de Fabric
- Seleccion de version de Minecraft + loader de Fabric
- Sincronizacion de mods requeridos por version (control del desarrollador)
- Arranque local del juego
- App de escritorio (Electron) con botones para Login/Jugar

## Requisitos
- Node.js 20+
- Java 17+ (para versiones modernas)
- Cuenta Microsoft con Minecraft Java comprado
- Navegador Chromium (Edge/Chrome/Vivaldi/Brave) para login MSMC

## Rango de versiones permitido
El launcher ahora solo muestra y permite:
- Desde `1.20.0`
- Hasta `1.21.11`

## Uso rapido
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Abrir launcher visual:
   ```bash
   npm run dev
   ```

## Mods predeterminados (modo facil)
No necesitas editar JSON.

Solo pon tus mods `.jar` en una o varias de estas carpetas:
- `bundled-mods/common/` (mods para todas las versiones)
- `bundled-mods/1.20/` (mods para toda rama 1.20.x)
- `bundled-mods/1.21/` (mods para toda rama 1.21.x)
- `bundled-mods/<version>/` (mods exactos, ej. `1.21.11`)

Prioridad de carga:
1. `common`
2. rama (`1.20` o `1.21`)
3. version exacta (`1.21.11`)

Al lanzar esa version, PapuClient:
- instala todos los `.jar` resultantes
- elimina mods que no esten en la lista final

## Menu de mods dentro de Minecraft
Incluye `papu-branding-mod` con menu in-game estilo cliente.

- Tecla para abrir: `Right Shift`
- Funciona dentro del juego (no en el launcher)
- Tiene filtros, busqueda, favoritos y toggles guardados en:
  - `config/papuclient-modules.json`

## Modo avanzado (opcional)
Si quieres control fino, puedes usar `config/modpacks.json` con `localPath` o `url`.

## CLI (opcional)
Tambien puedes ejecutar el flujo en terminal:
```bash
npm run cli
```
