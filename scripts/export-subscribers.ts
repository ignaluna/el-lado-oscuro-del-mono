// Exporta las inscripciones a CSV (data/inscripciones-AAAA-MM-DD.csv).
// Uso: npm run export:inscripciones
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SqliteSubscriberStore } from '../server/storage/subscribers.ts';

const dataDir = resolve(import.meta.dirname, '..', process.env.DATA_DIR ?? 'data');
const store = new SqliteSubscriberStore(resolve(dataDir, 'inscripciones.sqlite'));
const rows = await store.all();
store.close();

const cols = ['id', 'email', 'name', 'phone', 'whatsapp_consent', 'consent_version', 'source', 'created_at'] as const;
const esc = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
const file = resolve(dataDir, `inscripciones-${new Date().toISOString().slice(0, 10)}.csv`);
writeFileSync(file, '﻿' + csv); // BOM para que Excel respete los acentos
console.log(`${rows.length} inscripciones exportadas a ${file}`);
