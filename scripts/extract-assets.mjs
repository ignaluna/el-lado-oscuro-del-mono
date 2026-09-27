// Genera recursos derivados de la portada (client/public/assets/portada.jpg).
// Uso: node scripts/extract-assets.mjs  (requiere `sharp`, solo para preparar assets)
import sharp from 'sharp';
const src = 'client/public/assets/portada.jpg';
const out = 'client/public/assets';

// Imagen para compartir (Open Graph 1200x630)
await sharp(src).extract({ left: 0, top: 285, width: 1200, height: 630 })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(`${out}/og.jpg`);
// Portada liviana para el reproductor / media session
await sharp(src).resize(512, 512).jpeg({ quality: 78, mozjpeg: true }).toFile(`${out}/portada-512.jpg`);

// Huellas (dedos que sostienen el disco): blanco sobre transparente, a partir de la luminancia.
async function fingerprint(region, name) {
  const { data, info } = await sharp(src).extract(region).greyscale()
    .linear(2.4, -250).raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    rgba[i * 4] = 245; rgba[i * 4 + 1] = 242; rgba[i * 4 + 2] = 232; rgba[i * 4 + 3] = data[i];
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: 360 }).webp({ quality: 80 }).toFile(`${out}/${name}`);
}
await fingerprint({ left: 0, top: 480, width: 300, height: 320 }, 'huella-izq.webp');
await fingerprint({ left: 850, top: 470, width: 345, height: 330 }, 'huella-der.webp');
console.log('Assets generados en', out);
