import { stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

/**
 * Almacén de audios. La ruta /api/audio/:id valida el estreno y recién después le pide el
 * archivo a esta interfaz. Para usar almacenamiento de objetos privado (S3/R2/GCS) se implementa
 * `resolve` devolviendo { kind: 'redirect', url: <URL firmada de corta duración> }.
 */
export type AudioSource =
  | { kind: 'file'; path: string; size: number; contentType: string; demo: boolean }
  | { kind: 'redirect'; url: string; demo: boolean };

export interface AudioStore {
  resolve(trackId: string): Promise<AudioSource | null>;
  /** ¿Existe audio real (no demo) para la canción? Solo metadato para la API de estado. */
  isDemo(trackId: string): Promise<boolean>;
}

const TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
};

async function fileInfo(path: string) {
  try {
    const s = await stat(path);
    return s.isFile() ? s : null;
  } catch {
    return null;
  }
}

export class LocalAudioStore implements AudioStore {
  constructor(
    private opts: {
      privateDir: string;
      demoDir: string;
      files: Record<string, string>;
      /** Orden de pisos, para elegir el demo correspondiente (demo-01.mp3…). */
      trackIds: string[];
      allowDemo: boolean;
    },
  ) {}

  private realPath(trackId: string) {
    const file = this.opts.files[trackId];
    // Solo nombres simples: nada de rutas relativas.
    if (!file || file.includes('/') || file.includes('\\') || file.startsWith('.')) return null;
    return join(this.opts.privateDir, file);
  }

  private demoPath(trackId: string) {
    const i = this.opts.trackIds.indexOf(trackId);
    if (i < 0) return null;
    return join(this.opts.demoDir, `demo-${String(i + 1).padStart(2, '0')}.mp3`);
  }

  async resolve(trackId: string): Promise<AudioSource | null> {
    if (!this.opts.trackIds.includes(trackId)) return null;
    const real = this.realPath(trackId);
    const realStat = real ? await fileInfo(real) : null;
    if (real && realStat) {
      return { kind: 'file', path: real, size: realStat.size, contentType: TYPES[extname(real).toLowerCase()] ?? 'application/octet-stream', demo: false };
    }
    if (!this.opts.allowDemo) return null;
    const demo = this.demoPath(trackId);
    const demoStat = demo ? await fileInfo(demo) : null;
    if (demo && demoStat) return { kind: 'file', path: demo, size: demoStat.size, contentType: 'audio/mpeg', demo: true };
    return null;
  }

  async isDemo(trackId: string) {
    const real = this.realPath(trackId);
    return !(real && (await fileInfo(real)));
  }
}
