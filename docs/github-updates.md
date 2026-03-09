# GitHub Releases y Auto-Update

## 1. Crear el repositorio

Sube este proyecto a un repositorio de GitHub. El updater esta configurado para usar GitHub Releases.

Antes de publicar, cambia estos campos en [package.json](/d:/PapuClient/package.json):

- `repository.url`
- `build.publish[0].owner`
- `build.publish[0].repo`

## 2. Crear un token de GitHub

Crea un token clasico o fine-grained con permisos para publicar releases en ese repo.

En PowerShell, antes de publicar:

```powershell
$env:GH_TOKEN="TU_TOKEN_DE_GITHUB"
```

## 3. Publicar una version

Sube la version en [package.json](/d:/PapuClient/package.json), por ejemplo:

- `0.1.0` -> `0.1.1`

Luego ejecuta:

```powershell
npm run publish:github
```

Eso genera el instalador de Windows y lo publica en GitHub Releases.

## 4. Como funciona en los clientes

Cuando alguien instala el launcher desde una release de GitHub:

- al abrir la app, se busca una actualizacion
- si hay una nueva version, aparece un prompt para descargarla
- cuando termina de descargarse, aparece un prompt para reiniciar e instalar

Nota:

- el auto-update no funciona en `npm run app`
- funciona en la app instalada desde una release empaquetada
