// Runs the Apps Script of the sign-up sheet (Code.gs) in Node against an in-memory spreadsheet (sheet-sim.cjs):
//   node --test web/tools/leads/Code.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadScript } = require('./sheet-sim.cjs');

/** The script, checking that every answer is JSON. */
function load(opts) {
  const s = loadScript(opts);
  const post = (data) => {
    const out = s.postRaw(typeof data === 'string' ? data : JSON.stringify(data));
    assert.equal(out.mime, 'application/json');
    return JSON.parse(out.body);
  };
  return { ...s, post };
}

const LEAD = {
  name: 'Prueba', whatsapp: '+598 99 123 456', email: 'Prueba@Example.com', instagram: '@usuario.prueba', consent: true,
  consentText: 'Acepto recibir novedades', consentVersion: 'v1-2026-09', source: 'prelaunch:monosdelambiente.netlify.app',
  locale: 'es-UY', timeZone: 'America/Montevideo', createdAt: '2026-10-23T15:00:00.000Z', website: '',
};

test('health check answers who it is', () => {
  const { ctx } = load();
  assert.deepEqual(JSON.parse(ctx.doGet().body), { ok: true, service: 'eldom-leads' });
});

test('the first sign-up creates the sheet with its headers and one row, as typed', () => {
  const { post, book, rows, ctx } = load();
  const res = post(LEAD);
  assert.deepEqual(res, { ok: true, id: 'id-1' });
  const sheet = book.getSheetByName('Inscriptos');
  assert.deepEqual(sheet.cells[0], [...ctx.HEADERS]); // the script runs in its own realm
  assert.equal(sheet.frozen, 1);
  assert.deepEqual(rows(), [['2026-10-23 12:00:00', 'Prueba', '+59899123456', 'prueba@example.com', 'usuario.prueba', 'Sí',
    'v1-2026-09', 'Acepto recibir novedades', 'prelaunch:monosdelambiente.netlify.app', 'es-UY', 'America/Montevideo', 'id-1']]);
});

test('the WhatsApp keeps its "+" and a formula-like value stays text', () => {
  const { ctx } = load();
  const row = ctx.toRow({ ...ctx.parseLead(JSON.stringify({ ...LEAD, name: '=HYPERLINK("http://x","y")' })) }, 'when', 'id');
  assert.equal(row[1], `'=HYPERLINK("http://x","y")`);
  assert.equal(row[2], "'+59899123456");
});

test('the same person twice is one row: by email, by WhatsApp or by Instagram (any case)', () => {
  const { post, rows } = load();
  post(LEAD);
  assert.deepEqual(post({ ...LEAD, whatsapp: '', instagram: '', email: 'PRUEBA@example.com' }), { ok: true, duplicate: true });
  assert.deepEqual(post({ ...LEAD, email: '', instagram: '', whatsapp: '+59899123456' }), { ok: true, duplicate: true });
  assert.deepEqual(post({ ...LEAD, email: '', whatsapp: '', instagram: 'USUARIO.PRUEBA' }), { ok: true, duplicate: true });
  assert.equal(rows().length, 1);
  assert.deepEqual(post({ ...LEAD, whatsapp: '', instagram: '', email: 'otra@example.com' }), { ok: true, id: 'id-2' });
  assert.equal(rows().length, 2);
});

test('a bot that fills the hidden field is told yes and nothing is stored', () => {
  const { post, rows } = load();
  assert.equal(post({ ...LEAD, website: 'http://spam.example' }).ok, true);
  assert.equal(rows().length, 0);
});

test('anything invalid is refused and nothing is stored', () => {
  const { post, rows } = load();
  for (const bad of [
    { ...LEAD, whatsapp: '', email: '', instagram: '' },
    { ...LEAD, email: 'no-es-un-mail' },
    { ...LEAD, whatsapp: '099 123' },
    { ...LEAD, instagram: 'mal..usuario' },
    { ...LEAD, consent: false },
    { ...LEAD, consent: 'true' },
    '[1,2]',
    'no es json',
    '',
  ]) assert.deepEqual(post(bad), { ok: false, error: 'invalid' }, JSON.stringify(bad).slice(0, 60));
  assert.equal(rows().length, 0);
});

test('long or odd text is trimmed to size', () => {
  const { ctx } = load();
  const lead = ctx.parseLead(JSON.stringify({ ...LEAD, name: ' A\u0007B ' + 'x'.repeat(200), source: 's'.repeat(500) }));
  assert.equal(lead.name.length, 80);
  assert.ok(lead.name.startsWith('A B'));
  assert.equal(lead.source.length, 120);
});

test('when another sign-up holds the sheet too long, the answer is "busy" (the site retries)', () => {
  const { post, rows } = load({ lockFree: false });
  assert.deepEqual(post(LEAD), { ok: false, error: 'busy' });
  assert.equal(rows().length, 0);
});
