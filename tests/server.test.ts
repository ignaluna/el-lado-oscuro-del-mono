import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { site } from '../shared/site.config.ts';
import { zonedToUtcMs } from '../shared/time.ts';
import { createApp } from '../server/app.ts';
import { createReleaseSchedule } from '../server/release.ts';
import { LocalAudioStore } from '../server/storage/audio.ts';
import { SqliteSubscriberStore } from '../server/storage/subscribers.ts';

const ids = site.tracks.map((t) => t.id);
const tmp = mkdtempSync(join(tmpdir(), 'ascensor-'));
const privateDir = join(tmp, 'private');
const demoDir = resolve(import.meta.dirname, '../server/demo-audio');

async function start(opts: { now: () => number; releaseAt: number | null; dbFile?: string; isProduction?: boolean; devRelease?: string }) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(privateDir, { recursive: true });
  const release = createReleaseSchedule({
    isProduction: opts.isProduction ?? true,
    devRelease: opts.devRelease,
    now: opts.now,
    configured: opts.releaseAt,
  });
  const subscribers = new SqliteSubscriberStore(opts.dbFile ?? ':memory:');
  const audio = new LocalAudioStore({ privateDir, demoDir, files: { 'en-una': '01-en-una.mp3' }, trackIds: ids, allowDemo: true });
  const server: Server = createServer(createApp({ release, subscribers, audio, distDir: join(tmp, 'dist'), isProduction: opts.isProduction ?? true, rateLimit: 50 }));
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  return {
    base,
    subscribers,
    close: () => new Promise<void>((r) => { try { subscribers.close(); } catch { /* ya cerrada */ } server.close(() => r()); }),
  };
}

const post = (base: string, body: unknown) =>
  fetch(`${base}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('zona horaria de Uruguay', () => {
  test('21:00 en Montevideo = 00:00 UTC del día siguiente', () => {
    assert.equal(zonedToUtcMs('2026-11-20', '21:00', 'America/Montevideo'), Date.UTC(2026, 10, 21, 0, 0));
  });
  test('fecha inválida → null', () => {
    assert.equal(zonedToUtcMs('2026-13-40', '21:00', 'America/Montevideo'), null);
  });
});

describe('estreno validado en el servidor', () => {
  let clock = 1_000_000;
  const releaseAt = 1_000_000 + 60_000;
  let app: Awaited<ReturnType<typeof start>>;
  before(async () => { app = await start({ now: () => clock, releaseAt }); });
  after(() => app.close());

  test('antes del estreno: estado cerrado y sin URLs de audio', async () => {
    const s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.released, false);
    assert.equal(s.releaseAt, releaseAt);
    assert.deepEqual(s.tracks, []);
  });

  test('antes del estreno: el audio responde 403 aunque se conozca la URL', async () => {
    for (const id of ids) {
      const r = await fetch(`${app.base}/api/audio/${id}`);
      assert.equal(r.status, 403);
      assert.equal(r.headers.get('cache-control'), 'no-store');
    }
    const h = await fetch(`${app.base}/api/audio/en-una`, { headers: { Range: 'bytes=0-100' } });
    assert.equal(h.status, 403);
  });

  test('al llegar la hora: se habilita sin reiniciar el servidor', async () => {
    clock = releaseAt; // el reloj del servidor llega al estreno
    const s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.released, true);
    assert.equal(s.tracks.length, 9);
    assert.equal(s.tracks[0].src, '/api/audio/en-una');
    assert.equal(s.tracks[0].demo, true);
  });

  test('después del estreno: audio con soporte de Range (necesario en iOS)', async () => {
    const full = await fetch(`${app.base}/api/audio/pato`);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('x-audio-demo'), '1');
    const r = await fetch(`${app.base}/api/audio/pato`, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(r.status, 206);
    assert.match(r.headers.get('content-range') ?? '', /^bytes 0-1023\/\d+$/);
    assert.equal((await r.arrayBuffer()).byteLength, 1024);
  });

  test('prefiere el audio real cuando existe', async () => {
    writeFileSync(join(privateDir, '01-en-una.mp3'), Buffer.alloc(2048, 1));
    const r = await fetch(`${app.base}/api/audio/en-una`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-audio-demo'), '0');
    const s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.tracks[0].demo, false);
  });

  test('id desconocido o con rutas → 404', async () => {
    assert.equal((await fetch(`${app.base}/api/audio/no-existe`)).status, 404);
    assert.equal((await fetch(`${app.base}/api/audio/..%2F..%2Fetc`)).status, 404);
  });
});

describe('sin fecha confirmada', () => {
  test('released=false y releaseAt=null ("Próximamente")', async () => {
    const app = await start({ now: () => Date.now(), releaseAt: null });
    const s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.releaseAt, null);
    assert.equal(s.released, false);
    await app.close();
  });
});

describe('override de desarrollo', () => {
  test('se ignora en producción', async () => {
    const app = await start({ now: () => 0, releaseAt: null, isProduction: true, devRelease: 'open' });
    const s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.released, false);
    assert.equal(s.devOverride, null);
    assert.equal((await fetch(`${app.base}/api/audio/pato`)).status, 403);
    await app.close();
  });
  test('en desarrollo, in:N programa el estreno N segundos después', async () => {
    let t = 5000;
    const app = await start({ now: () => t, releaseAt: null, isProduction: false, devRelease: 'in:10' });
    let s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.released, false);
    assert.equal(s.releaseAt, 15000);
    t = 15000;
    s = await (await fetch(`${app.base}/api/status`)).json();
    assert.equal(s.released, true);
    await app.close();
  });
});

describe('inscripciones', () => {
  const dbFile = join(tmp, 'subs.sqlite');

  test('valida email, consentimiento y largo del nombre', async () => {
    const app = await start({ now: () => 0, releaseAt: null, dbFile });
    let r = await post(app.base, { email: 'no-es-mail', consent: true });
    assert.equal(r.status, 422);
    assert.ok((await r.json()).fields.email);
    r = await post(app.base, { email: 'a@b.com', consent: false });
    assert.equal(r.status, 422);
    assert.ok((await r.json()).fields.consent);
    r = await post(app.base, { email: 'a@b.com', consent: true, name: 'x'.repeat(120) });
    assert.equal(r.status, 422);
    r = await fetch(`${app.base}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{roto' });
    assert.equal(r.status, 400);
    assert.equal(await app.subscribers.count(), 0);
    await app.close();
  });

  test('guarda, detecta duplicados (sin distinguir mayúsculas) y persiste tras reiniciar', async () => {
    let app = await start({ now: () => 0, releaseAt: null, dbFile });
    let r = await post(app.base, { email: '  Mono@Ejemplo.com ', name: ' Coco ', consent: true });
    assert.equal(r.status, 201);
    assert.deepEqual(await r.json(), { ok: true, status: 'created' });
    r = await post(app.base, { email: 'mono@ejemplo.com', consent: true });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, status: 'duplicate' });
    await app.close();

    app = await start({ now: () => 0, releaseAt: null, dbFile }); // "reinicio"
    const rows = await app.subscribers.all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, 'mono@ejemplo.com');
    assert.equal(rows[0].name, 'Coco');
    assert.equal(rows[0].consent_version, site.texts.consentVersion);
    assert.equal(rows[0].phone, null); // WhatsApp desactivado por defecto
    await app.close();
  });

  test('si la base falla, NO confirma el registro', async () => {
    const app = await start({ now: () => 0, releaseAt: null });
    app.subscribers.close(); // simula caída de la base
    const r = await post(app.base, { email: 'x@y.com', consent: true });
    assert.equal(r.status, 500);
    assert.equal((await r.json()).ok, false);
    await app.close().catch(() => {});
  });

  test('honeypot: rechaza bots', async () => {
    const app = await start({ now: () => 0, releaseAt: null });
    const r = await post(app.base, { email: 'bot@spam.com', consent: true, website: 'http://spam' });
    assert.equal(r.status, 400);
    assert.equal(await app.subscribers.count(), 0);
    await app.close();
  });
});
