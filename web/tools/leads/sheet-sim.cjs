// The sign-up sheet in Node: runs the real Apps Script (Code.gs) against an in-memory spreadsheet that keeps values
// the way Google Sheets does (a leading apostrophe marks text and is not stored). Used by Code.test.cjs and by the
// harness's mock endpoint (tools/check.cjs, scenario `leads`).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODE = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');

function makeBook() {
  const sheets = new Map();
  const makeSheet = () => {
    const cells = [];
    const sheet = {
      cells,
      frozen: 0,
      getLastRow: () => cells.length,
      setFrozenRows(n) { sheet.frozen = n; },
      getRange: (r, c, nr = 1, nc = 1) => ({
        setValues(vals) {
          vals.forEach((row, i) => {
            while (cells.length < r + i) cells.push([]);
            row.forEach((v, j) => { cells[r - 1 + i][c - 1 + j] = typeof v === 'string' && v.startsWith("'") ? v.slice(1) : v; });
          });
          return this;
        },
        createTextFinder(text) {
          const f = {
            exactCase: true, entire: false,
            matchCase(b) { f.exactCase = b; return f; },
            matchEntireCell(b) { f.entire = b; return f; },
            findNext() {
              const want = f.exactCase ? String(text) : String(text).toLowerCase();
              for (let i = r - 1; i < Math.min(cells.length, r - 1 + nr); i++) {
                for (let j = c - 1; j < c - 1 + nc; j++) {
                  const v = f.exactCase ? String(cells[i][j] ?? '') : String(cells[i][j] ?? '').toLowerCase();
                  if (f.entire ? v === want : v.includes(want)) return { row: i + 1, column: j + 1 };
                }
              }
              return null;
            },
          };
          return f;
        },
      }),
    };
    return sheet;
  };
  return {
    sheets,
    getSheetByName: (n) => sheets.get(n) || null,
    insertSheet: (n) => { const s = makeSheet(); sheets.set(n, s); return s; },
    getSpreadsheetTimeZone: () => 'America/Montevideo',
  };
}

/** Loads Code.gs with Google's services faked. `lockFree: false` simulates another sign-up holding the sheet. */
function loadScript({ lockFree = true } = {}) {
  const book = makeBook();
  let ids = 0;
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => book },
    LockService: { getScriptLock: () => ({ tryLock: () => lockFree, releaseLock() {} }) },
    Utilities: { getUuid: () => 'id-' + ++ids, formatDate: () => '2026-10-23 12:00:00' },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (body) => ({ body, setMimeType(m) { this.mime = m; return this; } }) },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  /** Posts a body exactly as received over HTTP; returns the script's output. */
  const postRaw = (text) => ctx.doPost({ postData: { contents: text } });
  const post = (data) => JSON.parse(postRaw(typeof data === 'string' ? data : JSON.stringify(data)).body);
  const rows = () => { const s = book.getSheetByName('Inscriptos'); return s ? s.cells.slice(1).map((r) => [...r]) : []; };
  return { ctx, book, post, postRaw, rows };
}

module.exports = { loadScript };
