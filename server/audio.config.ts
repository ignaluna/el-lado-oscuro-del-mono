/**
 * ARCHIVOS DE AUDIO — solo los lee el servidor (nunca llegan al navegador ni al bundle).
 *
 * Copiá los masters comprimidos (recomendado: MP3 256 kbps o AAC .m4a) en `server/private-audio/`
 * con estos nombres. Mientras un archivo no exista, el servidor usa el audio de prueba del piso
 * (server/demo-audio/) y la interfaz lo marca como "AUDIO DE PRUEBA" — salvo que DEMO_AUDIO=false.
 *
 * La clave es el `id` de la canción en shared/site.config.ts.
 */
export const audioFiles: Record<string, string> = {
  'en-una': '01-en-una.mp3',
  'que-te-esta-pasando': '02-que-te-esta-pasando.mp3',
  pato: '03-pato.mp3',
  explotar: '04-explotar.mp3',
  'que-carajo': '05-que-carajo.mp3',
  portales: '06-portales.mp3',
  'casi-perdido': '07-casi-perdido.mp3',
  'no-me-perdones': '08-no-me-perdones.mp3',
  'el-lado-oscuro-del-mono': '09-el-lado-oscuro-del-mono.mp3',
};
