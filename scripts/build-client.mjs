// Compila el front (React + TypeScript) con esbuild a client/dist.
// - Divide el código: la escena 3D (three.js) se descarga solo si se usa.
// - Copia client/public tal cual e inyecta los nombres con hash en index.html.
import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const outdir = resolve(root, 'client/dist');

async function writeHtml(metafile) {
  const outputs = Object.entries(metafile.outputs);
  const entry = outputs.find(([, o]) => o.entryPoint?.endsWith('client/src/main.tsx'));
  if (!entry) throw new Error('No se encontró el bundle principal');
  const [jsPath, info] = entry;
  const cssPath = info.cssBundle;
  const { site } = await import(resolve(root, 'shared/site.config.ts') + `?t=${Date.now()}`).catch(() => ({ site: null }));
  let html = await readFile(resolve(root, 'client/index.html'), 'utf8');
  html = html
    .replace('<!--CSS-->', cssPath ? `<link rel="stylesheet" href="/assets/${basename(cssPath)}">` : '')
    .replace('<!--JS-->', `<script type="module" src="/assets/${basename(jsPath)}"></script>`);
  if (site) {
    html = html
      .replaceAll('%ALBUM%', site.album)
      .replaceAll('%BAND%', site.band)
      .replaceAll('%OG_IMAGE%', site.images.ogImage)
      .replaceAll('%TEASER%', site.texts.teaser);
  }
  await writeFile(resolve(outdir, 'index.html'), html);
}

export async function buildClient({ watch = false } = {}) {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });
  await cp(resolve(root, 'client/public'), outdir, { recursive: true });

  const options = {
    entryPoints: [resolve(root, 'client/src/main.tsx')],
    outdir: resolve(outdir, 'assets'),
    bundle: true,
    splitting: true,
    format: 'esm',
    target: ['es2020', 'safari15'],
    jsx: 'automatic',
    minify: !watch,
    sourcemap: watch ? 'linked' : false,
    metafile: true,
    entryNames: '[name]-[hash]',
    chunkNames: '[name]-[hash]',
    assetNames: '[name]-[hash]',
    loader: { '.woff2': 'file', '.png': 'file', '.jpg': 'file', '.svg': 'file' },
    define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
    logLevel: 'info',
    // Salvaguarda: nada del servidor (ni la lista de archivos de audio) puede entrar al bundle.
    plugins: [
      {
        name: 'no-server-code',
        setup(b) {
          b.onResolve({ filter: /server\// }, (args) => ({
            errors: [{ text: `El front no puede importar código del servidor: ${args.path}` }],
          }));
        },
      },
      {
        name: 'html',
        setup(b) {
          b.onEnd(async (result) => {
            if (result.errors.length === 0 && result.metafile) await writeHtml(result.metafile);
          });
        },
      },
    ],
  };

  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    return ctx;
  }
  const result = await esbuild.build(options);
  const sizes = Object.entries(result.metafile.outputs)
    .filter(([f]) => !f.endsWith('.map'))
    .map(([f, o]) => `  ${basename(f).padEnd(44)} ${(o.bytes / 1024).toFixed(1).padStart(8)} KB`);
  console.log('\nArchivos generados:\n' + sizes.join('\n'));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildClient({ watch: process.argv.includes('--watch') });
}
