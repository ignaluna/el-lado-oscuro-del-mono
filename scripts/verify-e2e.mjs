// Verificación de punta a punta (Playwright + Chromium, emulando celulares).
// Uso: npm run verify:e2e   (levanta su propio servidor con el estreno programado a +25 s)
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { chromium, devices } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const dataDir = mkdtempSync(join(tmpdir(), 'ascensor-e2e-'));
const shots = resolve(root, process.env.SHOTS_DIR ?? 'e2e-screenshots');
mkdirSync(shots, { recursive: true });
const RELEASE_IN = Number(process.env.RELEASE_IN ?? 25);

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  ✔' : '  ✘'} ${msg}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) Servidor con estreno a +N segundos (override de desarrollo)
const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts', `--dev-release=in:${RELEASE_IN}`], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, NODE_ENV: 'development' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
const t0 = Date.now();
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(`${BASE}/api/status`);
    if (r.ok) {
      const html = await (await fetch(BASE)).text();
      if (html.includes('<script')) break;
    }
  } catch {}
  await sleep(250);
}

const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader'] });

// Instrumentación: cuenta TODOS los elementos de audio que se crean en la página.
const countAudio = () => {
  window.__audios = [];
  const Orig = window.Audio;
  window.Audio = function (...a) {
    const el = new Orig(...a);
    window.__audios.push(el);
    return el;
  };
  window.Audio.prototype = Orig.prototype;
  const ce = document.createElement.bind(document);
  document.createElement = (tag, o) => {
    const el = ce(tag, o);
    if (String(tag).toLowerCase() === 'audio' || String(tag).toLowerCase() === 'video') window.__audios.push(el);
    return el;
  };
};
const audioReport = (page) =>
  page.evaluate(() =>
    window.__audios.map((a) => ({ src: a.currentSrc || a.src, paused: a.paused, t: a.currentTime, ended: a.ended })),
  );

try {
  console.log('\n▶ Antes del estreno (celular)');
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(countAudio);
  // Forzamos la escena 3D (el contenedor de CI tiene pocos núcleos y elegiría la 2D sola)
  await ctx.addInitScript(() => localStorage.setItem('escena', '3d'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.getByText('Estreno:').waitFor({ timeout: 10000 });
  ok(await page.getByRole('timer').isVisible(), 'muestra cuenta regresiva');
  ok(!(await page.getByRole('button', { name: 'Entrar al ascensor' }).count()), 'no hay botón para entrar');
  const st = await (await fetch(`${BASE}/api/status`)).json();
  ok(st.released === false && st.tracks.length === 0, 'la API no expone URLs de audio antes del estreno');
  ok((await fetch(`${BASE}/api/audio/en-una`)).status === 403, 'el audio responde 403 antes del estreno (validado en servidor)');
  await sleep(1500);
  await page.screenshot({ path: join(shots, '01-cerrado-celular.png') });

  // Llamar al ascensor (humor)
  await page.getByRole('button', { name: /Llamar al ascensor/ }).click();
  ok(await page.getByRole('status').filter({ hasText: 'afinando' }).isVisible(), 'el botón de llamada responde con un aviso');

  console.log('\n▶ Inscripción');
  const email = page.getByLabel(/^Email/);
  await email.fill('mono@ejemplo');
  await page.getByRole('button', { name: 'Avisame cuando se abra' }).click();
  ok(await page.getByText('Ese email no parece válido.').isVisible(), 'valida email');
  ok(await page.getByText('Tenés que aceptar').isVisible(), 'exige consentimiento explícito');
  ok(!(await page.getByLabel(/WhatsApp/).count()), 'campo WhatsApp desactivado por defecto');
  await email.fill('Mono@Ejemplo.com');
  await page.getByLabel(/^Nombre/).fill('Coco');
  await page.getByLabel(/Acepto recibir novedades/).check();
  await page.getByRole('button', { name: 'Avisame cuando se abra' }).click();
  await page.getByText('Estás en la lista').waitFor({ timeout: 5000 });
  ok(true, 'confirma el registro recién después de guardarlo');
  await page.screenshot({ path: join(shots, '02-registro-ok.png') });

  const db = new DatabaseSync(join(dataDir, 'inscripciones.sqlite'));
  const rows = db.prepare('SELECT email, name, consent_version FROM subscribers').all();
  ok(rows.length === 1 && rows[0].email === 'mono@ejemplo.com' && rows[0].name === 'Coco', 'quedó guardado en SQLite (email normalizado)');

  // Duplicado desde otra pestaña
  const p2 = await ctx.newPage();
  await p2.goto(BASE);
  await p2.getByLabel(/^Email/).fill('mono@ejemplo.com');
  await p2.getByLabel(/Acepto recibir novedades/).check();
  await p2.getByRole('button', { name: 'Avisame cuando se abra' }).click();
  await p2.getByText('Ya estabas en la lista').waitFor({ timeout: 5000 });
  ok(db.prepare('SELECT COUNT(*) n FROM subscribers').get().n === 1, 'duplicado detectado, sin fila repetida');
  await p2.close();
  db.close();

  console.log('\n▶ Llega la hora (sin recargar la página)');
  const waitMs = RELEASE_IN * 1000 - (Date.now() - t0) + 15000;
  await page.getByRole('button', { name: 'Entrar al ascensor' }).waitFor({ timeout: Math.max(5000, waitMs) });
  ok(true, 'el botón "Entrar al ascensor" aparece solo al llegar el estreno');
  ok((await audioReport(page)).length === 0, 'no se creó ni reprodujo audio antes de una interacción');
  await sleep(2500);
  await page.screenshot({ path: join(shots, '03-abierto-celular.png') });
  ok((await page.locator('.stage').getAttribute('data-scene')) === '3d', 'la escena 3D cargó en diferido y está activa');

  console.log('\n▶ Entrar');
  await page.getByRole('button', { name: 'Entrar al ascensor' }).click();
  await sleep(700);
  await page.screenshot({ path: join(shots, '04-entrando.png') });
  await page.getByRole('navigation', { name: /Pisos del ascensor/ }).waitFor({ timeout: 4000 });
  ok(true, 'aparece el panel de pisos');
  ok((await audioReport(page)).length === 0, 'entrar no reproduce música automáticamente');
  await sleep(1200);
  await page.screenshot({ path: join(shots, '05-adentro-celular.png') });

  console.log('\n▶ Cambio rápido de pisos');
  for (const n of [3, 5, 7, 2]) await page.getByRole('button', { name: new RegExp(`^Piso ${n}:`) }).tap();
  await sleep(2500);
  let rep = await audioReport(page);
  ok(rep.length === 1, `un único elemento de audio en toda la página (hay ${rep.length})`);
  const playing = rep.filter((a) => !a.paused);
  ok(playing.length === 1, 'suena una sola canción');
  ok(playing[0]?.src.endsWith('/api/audio/que-te-esta-pasando'), 'prevalece la última selección (piso 2)');
  ok((playing[0]?.t ?? 0) > 0.5, 'el audio avanza');
  ok(await page.getByRole('button', { name: /^Piso 2:/ }).getAttribute('aria-pressed') === 'true', 'se ilumina el botón del piso 2');
  ok((await page.locator('.indicator__title').innerText()).includes('Qué te está pasando'), 'el indicador muestra el nombre');
  await page.screenshot({ path: join(shots, '06-piso2-sonando.png') });

  console.log('\n▶ Controles');
  await page.getByRole('button', { name: 'Pausar' }).tap();
  await sleep(300);
  rep = await audioReport(page);
  ok(rep[0].paused, 'pausa');
  const tPaused = rep[0].t;
  await page.getByRole('button', { name: 'Reproducir' }).tap();
  await sleep(800);
  rep = await audioReport(page);
  ok(!rep[0].paused && rep[0].t >= tPaused, 'reanuda desde donde estaba');
  await page.getByRole('button', { name: 'Canción siguiente' }).tap();
  await sleep(800);
  rep = await audioReport(page);
  ok(rep[0].src.endsWith('/api/audio/pato'), 'siguiente → piso 3');
  await page.getByRole('button', { name: 'Canción anterior' }).tap();
  await sleep(800);
  rep = await audioReport(page);
  ok(rep[0].src.endsWith('/api/audio/pato') || rep[0].src.endsWith('/api/audio/que-te-esta-pasando'), 'anterior (reinicia o vuelve)');

  // Barra de progreso: ir al final → debe seguir con la próxima (reproducción continua)
  await page.getByRole('button', { name: /^Piso 8:/ }).tap();
  await sleep(1200);
  const range = page.getByRole('slider', { name: 'Posición en la canción' });
  await range.focus();
  await page.keyboard.press('End');
  await sleep(2500);
  rep = await audioReport(page);
  ok(rep[0].src.endsWith('/api/audio/el-lado-oscuro-del-mono') && !rep[0].paused, 'desplazamiento + reproducción continua (8 → 9)');
  ok(await page.getByText('AUDIO DE PRUEBA').first().isVisible(), 'los audios de prueba están identificados');

  console.log('\n▶ La música no se corta por la interfaz ni por la escena');
  const before = (await audioReport(page))[0];
  await page.getByRole('button', { name: /Sobre el disco/ }).tap();
  await page.getByRole('dialog').waitFor();
  await sleep(500);
  await page.getByRole('button', { name: 'Cerrar' }).tap();
  await page.getByRole('button', { name: /^Vista:/ }).tap(); // 3D → 2D: desmonta la escena 3D
  ok((await page.locator('.stage').getAttribute('data-scene')) === '2d', 'se desmontó la escena 3D');
  await sleep(1200);
  const afterRep = await audioReport(page);
  ok(afterRep.length === 1 && afterRep[0].src === before.src && !afterRep[0].paused && afterRep[0].t > before.t, 'abrir info y cambiar/desmontar la escena no reinicia el audio');
  await page.screenshot({ path: join(shots, '07-prisma-2d.png') });
  ok(errors.length === 0, `sin errores de JavaScript${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await ctx.close();

  console.log('\n▶ Movimiento reducido + teclado (Android)');
  const ctx2 = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
  await ctx2.addInitScript(countAudio);
  const pg = await ctx2.newPage();
  await pg.goto(BASE);
  const enter = pg.getByRole('button', { name: 'Entrar al ascensor' });
  await enter.waitFor();
  await enter.focus();
  await pg.keyboard.press('Enter');
  await pg.getByRole('navigation', { name: /Pisos/ }).waitFor({ timeout: 1500 });
  ok(true, 'con movimiento reducido el ingreso es casi inmediato');
  await pg.getByRole('button', { name: /^Piso 1:/ }).focus();
  await pg.keyboard.press('Enter');
  await sleep(1500);
  rep = await audioReport(pg);
  ok(rep.length === 1 && !rep[0].paused, 'se puede elegir y reproducir con teclado');
  await pg.screenshot({ path: join(shots, '08-reducido.png') });
  await ctx2.close();

  console.log('\n▶ Escritorio');
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pd = await ctx3.newPage();
  await pd.goto(BASE);
  await pd.getByRole('button', { name: 'Entrar al ascensor' }).waitFor();
  await sleep(3000);
  await pd.screenshot({ path: join(shots, '09-escritorio-abierto.png') });
  await pd.getByRole('button', { name: 'Entrar al ascensor' }).click();
  await pd.getByRole('navigation', { name: /Pisos/ }).waitFor();
  await pd.getByRole('button', { name: /^Piso 6:/ }).click();
  await sleep(2500);
  await pd.screenshot({ path: join(shots, '10-escritorio-adentro.png') });
  await ctx3.close();

  console.log('\n▶ Bundle de producción');
  const { buildClient } = await import('./build-client.mjs');
  await buildClient();
  const dist = resolve(root, 'client/dist');
  const files = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'));
  const leaks = files.filter((f) => /private-audio|01-en-una\.mp3|audio\.config/.test(readFileSync(join(dist, 'assets', f), 'utf8')));
  ok(leaks.length === 0, 'el bundle no contiene rutas ni nombres de los audios privados');
  ok(!readdirSync(dist, { recursive: true }).some((f) => String(f).endsWith('.mp3')), 'no hay audios dentro de client/dist');
} catch (err) {
  failures++;
  console.error('\nERROR:', err);
  console.error(serverLog.slice(-2000));
} finally {
  await browser.close();
  server.kill();
}

console.log(failures ? `\n✘ ${failures} verificación(es) fallaron` : '\n✔ Todo verificado');
console.log(`Capturas en ${shots}`);
process.exit(failures ? 1 : 0);
