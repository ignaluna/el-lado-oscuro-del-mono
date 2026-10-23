/** @OnlyCurrentDoc  (the script may touch this spreadsheet only) */

/**
 * Sign-ups of "El Lado Oscuro del Mono" → this spreadsheet (one row per person).
 *
 * Deployed as a web app (Execute as: Me · Who has access: Anyone); see LEEME.md. The site posts one sign-up per
 * request: a JSON body sent as text/plain, so browsers send it without a CORS preflight (Apps Script answers none),
 * and reads the JSON answer: { ok, id } · { ok, duplicate: true } · { ok: false, error: 'invalid' | 'busy' }.
 *
 * The address is public, so everything is checked again here; the rules mirror the site's form (src/00-base.html,
 * `Lead`). Pure helpers come first so tools/leads/Code.test.cjs can run them in Node with an in-memory sheet.
 */

var SHEET_NAME = 'Inscriptos';
var HEADERS = ['Fecha', 'Nombre', 'WhatsApp', 'Email', 'Instagram', 'Consentimiento', 'Versión del consentimiento',
  'Texto del consentimiento', 'Origen', 'Idioma', 'Zona horaria', 'ID'];
/** Columns (1-based) where an earlier sign-up of the same person would be. */
var CONTACT_COLUMNS = { whatsapp: 3, email: 4, instagram: 5 };
var LIMITS = { name: 80, consentText: 600, consentVersion: 40, source: 120, locale: 35, timeZone: 64 };

// ── pure helpers ───────────────────────────────────────────────────────────────────────────────────────────────

function normalizeWhatsapp(raw) {
  var v = String(raw || '').replace(/[\s\-.()]/g, '');
  return { value: v, empty: v === '', valid: /^\+[1-9]\d{7,14}$/.test(v) };
}

function normalizeEmail(raw) {
  var v = String(raw || '').trim().toLowerCase();
  return { value: v, empty: v === '', valid: v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) };
}

function normalizeInstagram(raw) {
  var v = String(raw || '').trim();
  var m = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (m) v = m[1];
  v = v.replace(/^@+/, '');
  var valid = /^[A-Za-z0-9._]{1,30}$/.test(v) && !/\.\./.test(v) && !/^\./.test(v) && !/\.$/.test(v);
  return { value: v, empty: v === '', valid: valid };
}

function clip(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n); }

/**
 * Reads one posted sign-up. Returns the normalized lead, or { honeypot: true } for a bot; throws on anything invalid.
 */
function parseLead(text) {
  var d = JSON.parse(String(text || ''));
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('not an object');
  if (d.website) return { honeypot: true };
  var wa = normalizeWhatsapp(d.whatsapp), em = normalizeEmail(d.email), ig = normalizeInstagram(d.instagram);
  if (wa.empty && em.empty && ig.empty) throw new Error('no contact');
  if ((!wa.empty && !wa.valid) || (!em.empty && !em.valid) || (!ig.empty && !ig.valid)) throw new Error('bad contact');
  if (d.consent !== true) throw new Error('no consent');
  return {
    name: clip(d.name, LIMITS.name), whatsapp: wa.value, email: em.value, instagram: ig.value,
    consentText: clip(d.consentText, LIMITS.consentText), consentVersion: clip(d.consentVersion, LIMITS.consentVersion),
    source: clip(d.source, LIMITS.source), locale: clip(d.locale, LIMITS.locale), timeZone: clip(d.timeZone, LIMITS.timeZone),
  };
}

/** A value the sheet must keep as typed: a leading = + - @ would turn it into a formula (or drop the "+"). */
function asText(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }

function toRow(lead, when, id) {
  return [when, asText(lead.name), asText(lead.whatsapp), asText(lead.email), asText(lead.instagram), 'Sí',
    asText(lead.consentVersion), asText(lead.consentText), asText(lead.source), asText(lead.locale), asText(lead.timeZone), id];
}

// ── the sheet ──────────────────────────────────────────────────────────────────────────────────────────────────

function ensureSheet(book) {
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** True when the same WhatsApp, email or Instagram is already in the sheet. */
function findDuplicate(sheet, lead) {
  var rows = sheet.getLastRow() - 1;
  if (rows < 1) return false;
  for (var key in CONTACT_COLUMNS) {
    if (!lead[key]) continue;
    var hit = sheet.getRange(2, CONTACT_COLUMNS[key], rows, 1).createTextFinder(lead[key]).matchCase(false).matchEntireCell(true).findNext();
    if (hit) return true;
  }
  return false;
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// ── web app ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Health check: the site's preflight tool opens this address and expects { ok: true, service: 'eldom-leads' }. */
function doGet() { return json({ ok: true, service: 'eldom-leads' }); }

function doPost(e) {
  var lead;
  try { lead = parseLead(e && e.postData ? e.postData.contents : ''); } catch (err) { return json({ ok: false, error: 'invalid' }); }
  if (lead.honeypot) return json({ ok: true, id: Utilities.getUuid() }); // a bot: pretend, store nothing
  var lock = LockService.getScriptLock(); // one writer at a time: the duplicate check and the new row go together
  if (!lock.tryLock(20000)) return json({ ok: false, error: 'busy' });
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ensureSheet(book);
    if (findDuplicate(sheet, lead)) return json({ ok: true, duplicate: true });
    var id = Utilities.getUuid();
    var when = Utilities.formatDate(new Date(), book.getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var row = toRow(lead, when, id);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    return json({ ok: true, id: id });
  } finally {
    lock.releaseLock();
  }
}
