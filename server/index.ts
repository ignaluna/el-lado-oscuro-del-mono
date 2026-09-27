import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { site } from '../shared/site.config.ts';
import { createApp } from './app.ts';
import { audioFiles } from './audio.config.ts';
import { createReleaseSchedule } from './release.ts';
import { LocalAudioStore } from './storage/audio.ts';
import { SqliteSubscriberStore } from './storage/subscribers.ts';

// Flags de línea de comando (evitan depender de cross-env en Windows):
//   --production            modo producción (ignora cualquier override de estreno)
//   --dev-release=in:30     override de estreno SOLO para desarrollo (ver server/release.ts)
const argv = process.argv.slice(2);
const flag = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const isProduction = argv.includes('--production') || process.env.NODE_ENV === 'production';
if (isProduction) process.env.NODE_ENV = 'production';
const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT ?? 5173);
const dataDir = resolve(root, process.env.DATA_DIR ?? 'data');

const release = createReleaseSchedule({ isProduction, devRelease: flag('dev-release') ?? process.env.DEV_RELEASE });
const subscribers = new SqliteSubscriberStore(resolve(dataDir, 'inscripciones.sqlite'));
const audio = new LocalAudioStore({
  privateDir: resolve(root, process.env.AUDIO_DIR ?? 'server/private-audio'),
  demoDir: resolve(root, 'server/demo-audio'),
  files: audioFiles,
  trackIds: site.tracks.map((t) => t.id),
  allowDemo: process.env.DEMO_AUDIO !== 'false',
});

const app = createApp({
  release,
  subscribers,
  audio,
  distDir: resolve(root, 'client/dist'),
  isProduction,
  trustProxy: process.env.TRUST_PROXY === 'true',
});

if (!isProduction) {
  // En desarrollo compilamos el front en modo watch dentro del mismo proceso (un solo puerto).
  const { buildClient } = await import('../scripts/build-client.mjs');
  await buildClient({ watch: true });
}

const server = createServer(app);
server.listen(port, () => {
  const at = release.releaseAt();
  console.log(`\n  🐒  El Lado Oscuro del Mono — http://localhost:${port}`);
  console.log(`  Modo: ${isProduction ? 'producción' : 'desarrollo'}`);
  console.log(`  Estreno: ${at ? new Date(at).toISOString() : 'sin fecha (Próximamente)'}${release.devOverride ? `  [override: ${release.devOverride}]` : ''}\n`);
});

function shutdown() {
  server.close();
  subscribers.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
