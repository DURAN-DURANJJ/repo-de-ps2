# PS2 en el navegador (Play!.js) con GitHub Pages

Este repo compila el emulador **Play!** (PlayStation 2) a WebAssembly con GitHub Actions y lo publica en tu propio GitHub Pages. Dentro de la página eliges tú el archivo del juego (ISO, CHD, CSO, ISZ, BIN o ELF) desde tu equipo; el juego no se sube a ningún sitio.

> Usa solo juegos que sean tuyos o de los que tengas derechos.

## Puesta en marcha

1. Crea un repo en GitHub (por ejemplo `ps2`) y sube el contenido de esta carpeta.
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. (Opcional, recomendado) **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `GATE_PASSWORD`
   - Valor: la contraseña que quieras.
4. Pestaña **Actions → "Build y publicar Play!.js" → Run workflow**.
   - La primera compilación tarda un buen rato (compila el emulador entero).
5. Al terminar, tu página estará en `https://TU_USUARIO.github.io/ps2/`.

## Mando

En Play!.js los mandos funcionan si el navegador los detecta: haz clic dentro de la página y pulsa un botón del mando. Si no responde, mira el menú de controles del emulador.

## "Solo yo y por un rato"

- La contraseña (`GATE_PASSWORD`) es **solo una puerta en el navegador**: sirve para que no entre cualquiera por curiosidad, pero **no es seguridad real** (el hash va en el código de la página y alguien con conocimientos podría saltársela).
- GitHub Pages de un repo público es público. Un Pages privado solo existe en planes Enterprise Cloud.
- "Por un rato": cuando termines, **Settings → Pages → Unpublish site**, o borra el repo. Para volver a publicar, relanza el workflow.
- Si lo quieres de verdad privado, ejecútalo en tu ordenador: baja la carpeta `site` del artefacto del workflow y sírvela en local con `python3 -m http.server 8000`.

## Limitaciones conocidas

- Play!.js es experimental: solo parte de los juegos funcionan bien.
- Usa un service worker (`coi-serviceworker`) para añadir las cabeceras que exige WebAssembly con hilos, porque GitHub Pages no permite configurarlas. La primera visita recarga la página una vez.
- Los pasos de compilación son los del workflow oficial de Play! (`build-js.yaml`); si el proyecto cambia sus presets o dependencias, puede que haya que ajustar el workflow.
