# Arquitectura objetivo de PapuClient

## Objetivo
Construir un cliente estilo Lunar/Badlion, pero con ecosistema Fabric y soporte de multiples versiones.

## Lo que ya hace este MVP
- Login Microsoft con cuenta Minecraft comprada.
- Seleccion de version de juego y loader Fabric.
- Creacion del perfil Fabric para la version elegida.
- Sincronizacion de mods obligatorios por version desde `config/modpacks.json`.
- Reinstalacion de mods faltantes y borrado de mods no permitidos al abrir.

## Fases recomendadas
1. MVP Launcher (este repo)
- Login Microsoft (MSA/Xbox/Minecraft)
- Seleccion de version
- Descarga y arranque vanilla/Fabric
- Directorio propio `.papuclient`

2. Cliente Desktop (UI)
- Electron o Tauri
- Pantalla de login
- Catalogo de versiones/perfiles
- Gestor de mods por perfil

3. Plataforma de perfiles
- Perfil por version (mods, shaderpacks, resource packs, JVM args)
- Exportar/importar perfil
- Actualizaciones diferenciales

4. Features estilo Lunar/Badlion
- Overlay FPS/CPS/keystrokes (mod cliente propio)
- Waypoints, macros, UI settings
- Optional anticheat (solo si hay backend dedicado)

## Compatibilidad Fabric
- Fuente oficial: https://meta.fabricmc.net/
- La compatibilidad real depende de versiones publicadas por Fabric.
- "Desde la mas baja hasta la ultima" significa: todas las versiones que Fabric meta exponga como disponibles.

## Menu personalizado dentro de Minecraft
Para tener menu custom tipo Lunar/Feather no basta con el launcher.
Necesitas un mod cliente propio Fabric (ejemplo: `papu-branding-mod`) que:
- Reemplace la pantalla titulo (`TitleScreen`) con mixins/inyeccion de UI.
- Renderice fondo, botones y branding propio.
- Opcional: abra vistas custom (cosmetics, store, settings).

## Seguridad y cumplimiento
- No distribuir assets propietarios de Mojang.
- Autenticacion solo via flujo oficial Microsoft.
- Respetar EULA de Mojang y terminos de APIs usadas.
- No existe "no borrable" 100% en cliente local; la estrategia correcta es verificacion + reparacion en cada inicio.

## Siguiente salto tecnico
- Agregar UI real y perfiles persistentes (SQLite/JSON)
- Integrar Modrinth API para resolver urls/hashes automaticamente
- Crear `papu-branding-mod` para menu custom in-game
- Empaquetado Windows (`.exe`) con auto-updater
