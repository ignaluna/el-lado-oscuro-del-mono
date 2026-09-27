// Genera 9 audios DE PRUEBA (no son canciones): un "ding" de ascensor + un arpegio distinto por piso.
// Sirven para probar el reproductor mientras no estén los masters. Requiere ffmpeg para MP3;
// sin ffmpeg deja WAV (renombrá la extensión en server/storage/audio.ts si los usás).
import { execFileSync } from 'node:child_process';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../server/demo-audio');
mkdirSync(out, { recursive: true });
const SR = 22050;
const SECONDS = 24;

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, 44 + i * 2));
  return buf;
}

for (let floor = 1; floor <= 9; floor++) {
  const n = SR * SECONDS;
  const s = new Float32Array(n);
  const root = 110 * Math.pow(2, (floor * 2 - 2) / 12); // cada piso, una tonalidad
  const steps = [0, 3 + (floor % 2), 7, 10, 12, 7];
  const bpm = 84 + floor * 6;
  const stepDur = 60 / bpm / 2;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    // "Ding" de ascensor al principio (dos notas)
    if (t < 1.4) {
      const f = t < 0.45 ? 1318.5 : 1046.5;
      const tt = t < 0.45 ? t : t - 0.45;
      v += 0.35 * Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 4);
    } else {
      const tt = t - 1.4;
      const k = Math.floor(tt / stepDur);
      const local = tt - k * stepDur;
      const f = root * 2 * Math.pow(2, steps[k % steps.length] / 12);
      v += 0.22 * Math.sin(2 * Math.PI * f * local) * Math.exp(-local * 6);
      v += 0.12 * Math.sin(2 * Math.PI * root * tt) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * tt));
      // pulso "número de piso": `floor` clicks cada 4 segundos
      const cyc = tt % 4;
      for (let c = 0; c < floor; c++) {
        const d = cyc - (2 + c * 0.12);
        if (d > 0 && d < 0.04) v += 0.18 * Math.sin(2 * Math.PI * 2000 * d) * (1 - d / 0.04);
      }
    }
    const fade = Math.min(1, (n - i) / (SR * 1.5));
    s[i] = v * fade;
  }
  const name = `demo-${String(floor).padStart(2, '0')}`;
  const wavPath = resolve(out, `${name}.wav`);
  writeFileSync(wavPath, wav(s));
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-ac', '1', '-b:a', '64k',
      '-metadata', `title=AUDIO DE PRUEBA — piso ${floor}`, '-metadata', 'artist=Demo (no es el disco)', resolve(out, `${name}.mp3`)]);
    unlinkSync(wavPath);
  } catch {
    console.warn('ffmpeg no disponible: quedó el WAV', wavPath);
  }
}
console.log('Audios de prueba generados en', out);
