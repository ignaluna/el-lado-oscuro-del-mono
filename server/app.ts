import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import type { ReleaseStatus, SubscribeResponse } from '../shared/api-types.ts';
import { site } from '../shared/site.config.ts';
import type { ReleaseSchedule } from './release.ts';
import type { AudioStore } from './storage/audio.ts';
import type { SubscriberStore } from './storage/subscribers.ts';
import { validateSubscription } from './validation.ts';

export type AppDeps = {
  release: ReleaseSchedule;
  subscribers: SubscriberStore;
  audio: AudioStore;
  /** Carpeta del front compilado (client/dist). */
  distDir: string;
  isProduction: boolean;
  /** Límite de inscripciones por IP cada 10 minutos. */
  rateLimit?: number;
  trustProxy?: boolean;
};

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function sendJson(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(data),
    ...extra,
  });
  res.end(data);
}

async function readBody(req: IncomingMessage, limit = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function createApp(deps: AppDeps) {
  const trackIds = site.tracks.map((t) => t.id);
  const hits = new Map<string, number[]>();
  const limit = deps.rateLimit ?? 8;

  function clientIp(req: IncomingMessage) {
    if (deps.trustProxy) {
      const fwd = req.headers['x-forwarded-for'];
      if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
  }

  function rateLimited(ip: string) {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear(); // evita crecer sin límite
    return recent.length > limit;
  }

  async function status(res: ServerResponse) {
    const released = deps.release.isReleased();
    const tracks = released
      ? await Promise.all(trackIds.map(async (id) => ({ id, src: `/api/audio/${id}`, demo: await deps.audio.isDemo(id) })))
      : [];
    const body: ReleaseStatus = {
      serverTime: deps.release.now(),
      releaseAt: deps.release.releaseAt(),
      released,
      devOverride: deps.isProduction ? null : deps.release.devOverride,
      tracks,
    };
    sendJson(res, 200, body);
  }

  async function subscribe(req: IncomingMessage, res: ServerResponse) {
    const reply = (code: number, body: SubscribeResponse) => sendJson(res, code, body);
    if (!(req.headers['content-type'] ?? '').includes('application/json')) return reply(415, { ok: false, error: 'bad_request' });
    if (rateLimited(clientIp(req))) return reply(429, { ok: false, error: 'rate_limited' });
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readBody(req));
    } catch {
      return reply(400, { ok: false, error: 'bad_request' });
    }
    const v = validateSubscription(parsed, { whatsappEnabled: site.features.whatsappOptIn });
    if (!v.ok) return reply(422, { ok: false, error: 'validation', fields: v.fields });
    if (v.bot) return reply(400, { ok: false, error: 'bad_request' });
    try {
      const result = await deps.subscribers.add({
        ...v.value,
        consentText: site.texts.consentLabel,
        consentVersion: site.texts.consentVersion,
        source: deps.release.isReleased() ? 'web-post-estreno' : 'web-pre-estreno',
      });
      return reply(result === 'created' ? 201 : 200, { ok: true, status: result });
    } catch (err) {
      console.error('[inscripciones] Error al guardar:', err);
      return reply(500, { ok: false, error: 'server' });
    }
  }

  async function audio(req: IncomingMessage, res: ServerResponse, id: string) {
    // Validación del estreno del lado del servidor: antes de la hora, nada de audio.
    if (!deps.release.isReleased()) return sendJson(res, 403, { error: 'not_released' });
    const src = await deps.audio.resolve(id);
    if (!src) return sendJson(res, 404, { error: 'not_found' });
    if (src.kind === 'redirect') {
      res.writeHead(302, { Location: src.url, 'Cache-Control': 'no-store' });
      return res.end();
    }
    const headers: Record<string, string | number> = {
      'Content-Type': src.contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
      'X-Audio-Demo': src.demo ? '1' : '0',
      'Content-Disposition': 'inline',
    };
    const range = req.headers.range;
    const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
    if (m && (m[1] || m[2])) {
      let start: number;
      let end: number;
      if (m[1] === '') {
        start = Math.max(0, src.size - Number(m[2]));
        end = src.size - 1;
      } else {
        start = Number(m[1]);
        end = m[2] ? Math.min(Number(m[2]), src.size - 1) : src.size - 1;
      }
      if (start >= src.size || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${src.size}` });
        return res.end();
      }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${src.size}`, 'Content-Length': end - start + 1 });
      if (req.method === 'HEAD') return res.end();
      return createReadStream(src.path, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': src.size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(src.path).pipe(res);
  }

  async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
    const root = normalize(deps.distDir + sep);
    let rel = decodeURIComponent(pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = normalize(join(root, rel));
    if (!file.startsWith(root)) return sendJson(res, 400, { error: 'bad_path' });
    let target = file;
    let s = await stat(target).catch(() => null);
    if (!s || !s.isFile()) {
      // SPA: cualquier ruta sin extensión cae en index.html
      if (extname(rel)) return sendJson(res, 404, { error: 'not_found' });
      target = join(root, 'index.html');
      s = await stat(target).catch(() => null);
      if (!s) {
        res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('El front todavía no está compilado. Corré `npm run build` (o `npm run dev`).');
      }
    }
    const ext = extname(target).toLowerCase();
    const hashed = /-[A-Z0-9]{8}\.(js|css)$/.test(target);
    const cache =
      !deps.isProduction || ext === '.html'
        ? 'no-cache'
        : hashed
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=86400';
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Content-Length': s.size, 'Cache-Control': cache });
    if (req.method === 'HEAD') return res.end();
    if (ext === '.html') return res.end(await readFile(target));
    createReadStream(target).pipe(res);
  }

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const p = url.pathname;
      const method = req.method ?? 'GET';
      if (p === '/api/status' && method === 'GET') return await status(res);
      if (p === '/api/subscribe') {
        if (method !== 'POST') return sendJson(res, 405, { error: 'method' }, { Allow: 'POST' });
        return await subscribe(req, res);
      }
      const audioMatch = /^\/api\/audio\/([a-z0-9-]{1,80})$/.exec(p);
      if (audioMatch && (method === 'GET' || method === 'HEAD')) return await audio(req, res, audioMatch[1]);
      if (p.startsWith('/api/')) return sendJson(res, 404, { error: 'not_found' });
      if (method !== 'GET' && method !== 'HEAD') return sendJson(res, 405, { error: 'method' });
      return await serveStatic(req, res, p);
    } catch (err) {
      console.error('[server] Error inesperado:', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'server' });
      else res.end();
    }
  };
}
