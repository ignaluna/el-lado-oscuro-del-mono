# La web de lanzamiento — el ascensor

Página estática de **El Lado Oscuro del Mono**: el vacío con agua, el ascensor como en la portada, la cuenta regresiva
con el registro, los pisos-canción con los reproductores oficiales de YouTube y Spotify, el nivel de exploración, el
libro escondido y la galería. No necesita servidor: es un solo `index.html` con todo adentro (Three.js se carga de un
CDN).

Es independiente de la app del resto del repo (Railway): no comparte código ni dependencias, salvo Playwright para
las pruebas.

## Cómo está armada

- `src/` — las partes de la página, en orden. `00-base.html` tiene el HTML, el CSS y la configuración: `tracks`,
  `BOOK`, `GALLERY`, `LEVEL`, `RELEASE_AT`, `LEAD_ENDPOINT`, `PRIVACY_URL`.
- `tools/build.cjs` — junta `src/` y escribe:
  - `dist/`: la web para publicar (`index.html`, `portada.jpg` para la vista previa al compartir, `favicon.svg` y
    `_headers` con los encabezados que necesitan los reproductores). Hay que subir los cuatro juntos: `_headers`
    lleva el hash del script de ese `index.html`.
  - `artifact/index.html`: la versión para claude.ai (ahí los reproductores son enlaces).
- `tools/check.cjs` — pruebas de punta a punta en el navegador (escenarios `smoke`, `cabin`, `mini`, `level`,
  `roam`, `integrations`, …). `--dist` las corre sobre `dist/` con sus encabezados; `--url` sobre el sitio publicado.
- `tools/preflight.cjs` — verifica los ids de YouTube y Spotify y, con `--site`, el sitio publicado.
- `tools/leads/` — la planilla de Google donde caen los registros: el programa (`Code.gs`), sus pruebas y cómo
  armarla ([LEEME.md](tools/leads/LEEME.md)).
- `odd/tasks/` — el registro de cada etapa: qué se hizo, por qué y cómo se verificó.

## Cambiar algo

1. Rama nueva desde `main` y editá `src/`.
2. Armá y probá (desde la raíz del repo, con `npm install` hecho):

   ```bash
   node web/tools/build.cjs
   node web/tools/check.cjs --scenario smoke,cabin,mini --viewport both
   ```

3. Abrí el PR a `main`. Netlify arma una vista previa con el botón DEV y deja el enlace en el PR.
4. Al mergear, Netlify publica la web final, sin el botón DEV.

## Publicación (Netlify)

`netlify.toml`, en la raíz del repo, le dice a Netlify que arme solo `web/`:

- `main` → `node tools/build.cjs --release --site $URL` (la dirección del sitio).
- Vista previa de cada PR → `node tools/build.cjs --site $DEPLOY_PRIME_URL` (las invitaciones y la imagen para
  compartir apuntan a la vista previa).
- Si en un cambio no se tocó nada de `web/`, Netlify no vuelve a armar la web.

Conectarlo, una sola vez: en Netlify, *Add new site → Import an existing project → GitHub* y elegir este repo; la
configuración se lee de `netlify.toml`. Un sitio subido antes arrastrando la carpeta se puede vincular al repo desde
*Site configuration → Build & deploy → Link repository* y conserva su dirección.

Sin Netlify, `node web/tools/build.cjs --release --site https://DIRECCION` deja en `web/dist/` los cuatro archivos
para cualquier hosting estático (Cloudflare Pages también lee `_headers`; en otro hosting hay que cargar esos mismos
encabezados).

Después de publicar, verificar el sitio real:

```bash
node web/tools/preflight.cjs --site https://DIRECCION
node web/tools/check.cjs --scenario selftest,integrations,failures,level --viewport both --url https://DIRECCION
```

En el celular: botón DEV → «Probar reproductores» (en la versión `--release` el botón no se ve: abrir la dirección
con `#dev` al final).

## Antes del lanzamiento

- Registros: con `LEAD_ENDPOINT` en `null`, cada registro queda solo en el navegador de quien se anota. Hay que poner
  la dirección `/exec` de la planilla de la banda ([tools/leads/LEEME.md](tools/leads/LEEME.md)) antes de difundir
  el enlace.
- Los datos de música son los del disco de prueba (*Pequeño Primate*): reemplazar por los ids reales en `tracks`,
  revisar `RELEASE_AT` (provisoria) y `PRIVACY_URL`.
- Los textos provisorios están listados en cada documento de `odd/tasks/`.
