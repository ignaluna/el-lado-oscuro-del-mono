# Alojamiento previsto

La app es **un único servicio Node** que sirve el front, la API y los audios. Tiene dos cosas que
**deben persistir** entre reinicios y despliegues:

| Qué | Dónde vive hoy | Variable |
|---|---|---|
| Inscripciones (SQLite) | `data/inscripciones.sqlite` | `DATA_DIR` |
| Audios del disco (privados) | `server/private-audio/` | `AUDIO_DIR` |

La validación del estreno **siempre** ocurre en el servidor (`/api/status` y `/api/audio/:id`
comparan contra el reloj del servidor). Ninguna opción de las de abajo cambia eso.

---

## Opción A (recomendada para el MVP): un servicio con volumen persistente

Cualquier plataforma que ejecute un proceso Node de larga vida **y** monte un disco persistente:
Fly.io (volumes), Railway (volumes), Render (servicio con disco persistente) o un VPS chico
(Hetzner, DigitalOcean, etc.) con Caddy/Nginx delante para HTTPS.

1. Montar el volumen, por ejemplo en `/data`.
2. Variables:
   ```
   DATA_DIR=/data/db
   AUDIO_DIR=/data/audio
   DEMO_AUDIO=false
   TRUST_PROXY=true   # si hay proxy/CDN delante
   PORT=8080          # o el que indique la plataforma
   ```
3. Subir los masters a `/data/audio` (por SFTP/`fly ssh`/consola) — **no** al repositorio.
4. `npm ci && npm run build && npm start`.
5. **Una sola instancia.** SQLite y el límite de intentos en memoria asumen un único proceso.
   Para escalar horizontalmente, pasar a la opción B.
6. **Backups:** copiar `inscripciones.sqlite` a diario (o usar Litestream hacia un bucket privado).
   Para exportar a mano: `npm run export:inscripciones` (CSV).

Requisitos: Node ≥ 22.13 (usa `node:sqlite`, sin dependencias nativas).

## Opción B: plataforma sin disco (Vercel, Netlify, Cloud Run sin volumen…)

El sistema de archivos es efímero: **SQLite en archivo y los audios locales no sirven**.
La app ya está preparada para cambiar las piezas sin tocar el resto:

- **Inscripciones → base administrada.** Implementar `SubscriberStore`
  (`server/storage/subscribers.ts`) con Turso/libSQL (compatible con SQLite), Supabase o Neon
  (Postgres). La tabla y la restricción `UNIQUE(email)` son las mismas.
- **Audios → almacenamiento de objetos PRIVADO** (Cloudflare R2, S3, GCS). Implementar
  `AudioStore.resolve()` (`server/storage/audio.ts`) devolviendo
  `{ kind: 'redirect', url: <URL firmada de pocos minutos> }`. El bucket nunca es público y
  la URL firmada se genera **solo después** de que el servidor confirma el estreno.
- `/api/status`, `/api/subscribe` y `/api/audio/:id` pasan a ser funciones del servidor;
  el front compilado (`client/dist`) puede ir a cualquier CDN.

## Cuidados comunes

- **CDN:** no cachear `/api/*`. La API ya responde `Cache-Control: no-store` en estado, inscripciones
  y en el 403 previo al estreno.
- **Hora del servidor:** el estreno depende de su reloj; las plataformas usan NTP. La fecha se
  interpreta en `America/Montevideo` (UTC-3), así que el huso del servidor da igual.
- **Día del estreno:** probar antes el flujo completo en un entorno de staging con
  `--dev-release=in:60` (fuera de producción).
- **Privacidad:** las inscripciones guardan el texto y la versión del consentimiento aceptado.
  Definir quién accede a la base y cómo se atienden las bajas.
