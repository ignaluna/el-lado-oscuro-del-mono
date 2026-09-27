import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ValidSubscription } from '../validation.ts';

/**
 * Almacén de inscripciones. La app solo conoce esta interfaz: para pasar a una base administrada
 * (Postgres/Turso/Supabase) se escribe otra implementación y se cambia en server/index.ts.
 */
export interface SubscriberStore {
  add(sub: ValidSubscription & { consentText: string; consentVersion: string; source: string }): Promise<'created' | 'duplicate'>;
  count(): Promise<number>;
  all(): Promise<SubscriberRow[]>;
  close(): void;
}

export type SubscriberRow = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  whatsapp_consent: number;
  consent_text: string;
  consent_version: string;
  source: string;
  created_at: string;
};

export class SqliteSubscriberStore implements SubscriberStore {
  private db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT,
        phone TEXT,
        whatsapp_consent INTEGER NOT NULL DEFAULT 0,
        consent_text TEXT NOT NULL,
        consent_version TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
    `);
  }

  async add(sub: ValidSubscription & { consentText: string; consentVersion: string; source: string }) {
    const res = this.db
      .prepare(
        `INSERT INTO subscribers (email, name, phone, whatsapp_consent, consent_text, consent_version, source)
         VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING`,
      )
      .run(sub.email, sub.name, sub.phone, sub.whatsappConsent ? 1 : 0, sub.consentText, sub.consentVersion, sub.source);
    return Number(res.changes) === 1 ? 'created' : 'duplicate';
  }

  async count() {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM subscribers').get() as { n: number };
    return Number(row.n);
  }

  async all() {
    return this.db.prepare('SELECT * FROM subscribers ORDER BY id').all() as unknown as SubscriberRow[];
  }

  close() {
    this.db.close();
  }
}
