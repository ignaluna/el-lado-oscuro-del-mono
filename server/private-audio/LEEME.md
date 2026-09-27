# Audios privados del disco

Poné acá los masters comprimidos con los nombres que figuran en `server/audio.config.ts`
(por ejemplo `01-en-una.mp3`). Esta carpeta:

- **no** se publica como estática ni entra al bundle del navegador;
- está excluida del repositorio (`.gitignore`);
- solo se sirve a través de `/api/audio/:id`, y **solo después del estreno** (lo valida el servidor).

Mientras falte un archivo, el servidor usa el audio de prueba de `server/demo-audio/`
y la interfaz lo marca como "AUDIO DE PRUEBA". Para el lanzamiento real, definí `DEMO_AUDIO=false`.
