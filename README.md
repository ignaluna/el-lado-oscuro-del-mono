# El Lado Oscuro del Mono — web de lanzamiento (MVP)

Experiencia de lanzamiento del disco de **Monos del Ambiente**. Antes del estreno, el ascensor
está cerrado: hay cuenta regresiva y un formulario "Avisame cuando se abra". A la hora del
estreno se habilita solo: el visitante entra y cada piso es una canción.

> Proyecto artístico de Monos del Ambiente. No confundir con Monoambiente (propuesta comercial).

## Correr

Requiere **Node 22.13 o superior**.

```bash
npm install
npm run dev              # http://localhost:5173 — usa la fecha de shared/site.config.ts
```

Para probar los dos estados en desarrollo:

```bash
npm run dev:cerrado      # ascensor cerrado
npm run dev:abierto      # ya estrenado
npm run dev:estreno30    # se estrena 30 s después de arrancar: ver el cambio en vivo
# o cualquier fecha:  npx tsx server/index.ts --dev-release=2026-11-20T21:00:00-03:00
```

El override **solo existe en desarrollo**: con `--production` el servidor lo ignora y lo avisa
en el log. No hay ningún parámetro público para saltarse el estreno.

Producción:

```bash
npm run build && npm start   # sirve client/dist + API en PORT (5173 por defecto)
```

Antes de publicar, leé **[docs/ALOJAMIENTO.md](docs/ALOJAMIENTO.md)**: SQLite y los audios
necesitan disco persistente, o bien una base administrada y almacenamiento privado.

Pruebas:

```bash
npm test               # servidor: estreno, audio protegido, inscripciones (15 pruebas)
npm run verify:e2e     # navegador (iPhone/Pixel/escritorio): flujo completo + capturas
npm run typecheck      # TypeScript
```

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| **Fecha y hora del estreno** (hora de Uruguay) | `shared/site.config.ts` → `release` (`date: null` muestra "Próximamente") |
| Textos, mensajes, carteles con humor | `shared/site.config.ts` → `texts` |
| Enlaces (Instagram, Spotify…) | `shared/site.config.ts` → `links` (los vacíos no se muestran) |
| **Orden y títulos de las canciones**, color de cada piso | `shared/site.config.ts` → `tracks` (el orden es el de los pisos) |
| Imágenes (portada, imagen para compartir, huellas) | `client/public/assets/` + `shared/site.config.ts` → `images` |
| Huellas/dedos a los costados | `features.fingerprints` (apagado; las imágenes ya están recortadas) |
| Teléfono para WhatsApp | `features.whatsappOptIn` (apagado) |
| **Audios reales** | copiar a `server/private-audio/` con los nombres de `server/audio.config.ts` |
| Modelo 3D de Blender | `client/public/models/` + `scene.modelUrl` — ver [docs/MODELO-3D.md](docs/MODELO-3D.md) |
| Exportar inscripciones | `npm run export:inscripciones` → CSV en `data/` |

`shared/site.config.ts` es público (va al navegador). Los nombres de los archivos de audio
están aparte, en `server/audio.config.ts`, que solo lee el servidor.

## Cómo está armado

```
shared/          configuración y contratos compartidos (fecha, textos, canciones)
server/          Node sin framework: API, estreno, audio protegido, inscripciones
  storage/       interfaces intercambiables: SubscriberStore (SQLite) y AudioStore (disco local)
client/src/
  core/          lógica SIN interfaz: estreno, motor de audio único, recorrido, preferencias
  ui/            interfaz HTML accesible: formulario, panel de pisos, reproductor
  scene/         capa visual intercambiable: 3D (three.js, en diferido) o 2D (SVG)
```

- **La lógica no depende de la escena.** El audio es un único `<audio>` creado fuera de React;
  cambiar entre 3D y 2D, abrir información o desmontar la escena no lo reinicia.
- **Estreno validado en el servidor.** Antes de la hora, `/api/status` no entrega URLs y
  `/api/audio/:id` responde 403. Los audios no están en `client/dist` ni en el bundle.
  El cliente corrige la hora con el reloj del servidor y vuelve a consultar al llegar a cero, así
  que una página abierta desde antes se habilita sola.
- **Cambio rápido de pisos:** cada selección reemplaza la fuente del único reproductor; gana la
  última y nunca hay dos canciones sonando. La animación del viaje es solo visual y no bloquea.
- **Celulares:** el 3D se descarga después de mostrar la página (≈150 KB gzip, aparte del bundle
  principal de ≈65 KB). La resolución está limitada; si el equipo va lento, primero baja la
  resolución y después pasa a 2D. Sin WebGL, con ahorro de datos o con pocos núcleos usa 2D
  directamente. No se precarga el disco: solo se pide la canción elegida.
- **Accesibilidad:** controles HTML reales, navegación con teclado, anuncios `aria-live`,
  contraste alto y "Movimiento reducido" (respeta la preferencia del sistema y se puede forzar).

## Qué funciona y qué es provisional

Funciona y está verificado:

- Estados antes y después del estreno. El cambio ocurre en vivo, sin recargar.
- Cuenta regresiva en hora de Uruguay y "Próximamente" cuando no hay fecha.
- Inscripción con validación, duplicados, errores, honeypot y límite por IP. Solo confirma si se guardó.
- Ingreso con puertas, cámara guiada y panel de pisos.
- Reproductor completo, con reproducción continua, controles de pantalla bloqueada (Media Session) y estados de carga o error.
- Alternativa 2D y movimiento reducido.

Provisional:

- **Ascensor 3D de geometrías simples**, inspirado en la portada: arco, marca "II", escalones, botonera y haz con prisma. La estética todavía está sin validar.
- **Audios de prueba**: un "ding" más un arpegio por piso, marcados como "AUDIO DE PRUEBA".
- Enlaces vacíos y créditos pendientes.
- Tipografía Space Mono desde Google Fonts. Conviene alojarla en el propio servidor.

## Próxima versión (sugerido)

1. Validar la estética con la portada y modelar el GLB en Blender, con las puertas nombradas.
2. Portar la escena a React Three Fiber (ver docs/MODELO-3D.md; es un cambio acotado).
3. Mundos por piso: al llegar, se abren las puertas hacia un escenario propio con letra, créditos y video.
4. Envíos de email y WhatsApp a la lista, con baja en un clic.
5. Sección del show de lanzamiento (fecha, entradas, novedades).
6. Pequeño panel protegido para ver y exportar inscripciones.
7. Tipografías autoalojadas, analítica respetuosa (sin cookies) y pruebas en iPhone y Android reales.
