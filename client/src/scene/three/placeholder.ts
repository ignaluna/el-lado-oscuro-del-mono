import * as THREE from 'three';
import { site } from '../../../../shared/site.config.ts';
import { NODE } from './rig.ts';

/**
 * ASCENSOR PROVISIONAL — geometrías simples, inspirado en la portada:
 * puerta alta con arco, marca "II", escalones, botonera ▲▼ y un haz de luz con prisma.
 * Se reemplaza por un GLB con los mismos nombres de nodo (ver rig.ts / docs/MODELO-3D.md).
 *
 * Unidades: metros. La puerta está en z = 0; la cabina, detrás (z negativo).
 */

const OPEN_W = 1.0; // ancho del vano
const RECT_H = 2.1; // alto hasta donde arranca el arco
const R = OPEN_W / 2;
const FRAME = 0.08;
const CABIN = { w: 1.7, h: 2.9, d: 1.9 };

const CHALK = 0xefebe0;
export const BG = 0x0b0b0d;

function archShape(halfW: number, rectH: number, x0 = 0) {
  const s = new THREE.Shape();
  s.moveTo(x0 - halfW, 0);
  s.lineTo(x0 - halfW, rectH);
  s.absarc(x0, rectH, halfW, Math.PI, 0, true);
  s.lineTo(x0 + halfW, 0);
  s.lineTo(x0 - halfW, 0);
  return s;
}

function archPath(halfW: number, rectH: number) {
  const p = new THREE.Path();
  p.moveTo(-halfW, 0);
  p.lineTo(-halfW, rectH);
  p.absarc(0, rectH, halfW, Math.PI, 0, true);
  p.lineTo(halfW, 0);
  p.lineTo(-halfW, 0);
  return p;
}

const lineMat = () => new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0.85 });

function withEdges(mesh: THREE.Mesh, threshold = 20) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), lineMat());
  mesh.add(edges);
  return mesh;
}

/** Textura del haz de luz: rayas horizontales + banda de prisma (como en la portada). */
function spillTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  // rayas de luz cálida que se desvanecen hacia la izquierda
  for (let i = 0; i < 140; i++) {
    const y = 20 + Math.random() * 216;
    const len = 180 + Math.random() * 330;
    const grad = g.createLinearGradient(512, 0, 512 - len, 0);
    grad.addColorStop(0, 'rgba(255,250,210,0.55)');
    grad.addColorStop(1, 'rgba(255,250,210,0)');
    g.strokeStyle = grad;
    g.lineWidth = 0.6 + Math.random() * 1.4;
    g.beginPath();
    g.moveTo(512, y);
    g.lineTo(512 - len, y + (Math.random() - 0.5) * 6);
    g.stroke();
  }
  // banda de prisma
  const hues = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#32ade6', '#5856d6', '#af52de'];
  hues.forEach((h, i) => {
    const x = 170 + i * 14;
    const grad = g.createLinearGradient(0, 70, 0, 190);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, h);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55;
    g.fillStyle = grad;
    g.fillRect(x, 70, 14, 120);
  });
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cartelitos con humor dentro de la cabina. */
function signTexture(lines: string[]) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#16161a';
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = 'rgba(239,235,224,0.8)';
  g.lineWidth = 4;
  g.strokeRect(10, 10, 492, 236);
  g.fillStyle = '#efebe0';
  g.textAlign = 'center';
  g.font = '600 24px "Space Mono", ui-monospace, monospace';
  lines.slice(0, 3).forEach((l, i) => g.fillText(l.toUpperCase(), 256, 80 + i * 60, 470));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPlaceholder(): THREE.Group {
  const root = new THREE.Group();
  root.name = NODE.root;

  // Trazo de tiza: sin iluminación, siempre legible sobre el negro (como el dibujo de la portada)
  const chalk = new THREE.MeshBasicMaterial({ color: 0xd9d5ca });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b20, roughness: 0.8, metalness: 0.1 });

  // Pared invisible (color del fondo) con el vano: tapa la cabina desde afuera.
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-12, -2);
  wallShape.lineTo(12, -2);
  wallShape.lineTo(12, 9);
  wallShape.lineTo(-12, 9);
  wallShape.lineTo(-12, -2);
  wallShape.holes.push(archPath(R, RECT_H));
  const wall = new THREE.Mesh(new THREE.ShapeGeometry(wallShape, 24), new THREE.MeshBasicMaterial({ color: BG }));
  wall.name = 'OccluderWall';
  wall.position.z = 0.004; // delante de la cara frontal de la cabina (evita z-fighting)
  root.add(wall);

  // Marco en arco (el "trazo de tiza")
  const frameShape = archShape(R + FRAME, RECT_H);
  frameShape.holes.push(archPath(R, RECT_H));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape, { depth: 0.12, bevelEnabled: false, curveSegments: 24 }), chalk);
  frame.name = 'Frame';
  root.add(frame);

  // Tímpano (semicírculo sobre las puertas) con la marca "II"
  const transom = new THREE.Mesh(new THREE.CircleGeometry(R, 32, 0, Math.PI), dark);
  transom.position.set(0, RECT_H, 0.02);
  withEdges(transom, 80);
  root.add(transom);

  const indicator = new THREE.Group();
  indicator.name = NODE.indicator;
  for (const x of [-0.055, 0.055]) {
    const m = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: CHALK, emissiveIntensity: 0.35 });
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.13, 4, 8), m);
    bar.position.set(x, RECT_H + 0.26, 0.04);
    indicator.add(bar);
  }
  root.add(indicator);

  // Puertas corredizas
  const doorGeo = new THREE.BoxGeometry(R, RECT_H, 0.03);
  for (const [name, x] of [
    [NODE.doorLeft, -R / 2],
    [NODE.doorRight, R / 2],
  ] as const) {
    const d = withEdges(new THREE.Mesh(doorGeo, dark));
    d.name = name;
    d.position.set(x, RECT_H / 2, 0.04);
    root.add(d);
  }
  // hilo de luz entre puertas
  const seam = new THREE.Mesh(
    new THREE.PlaneGeometry(0.012, RECT_H - 0.05),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  seam.name = NODE.seam;
  seam.position.set(0, RECT_H / 2, 0.06);
  root.add(seam);

  // Escalones que bajan hacia el visitante
  for (let i = 0; i < 3; i++) {
    const step = withEdges(new THREE.Mesh(new THREE.BoxGeometry(OPEN_W + 0.2 - i * 0.04, 0.12, 0.28), dark));
    step.position.set(-0.04 * i, -0.06 - i * 0.12, 0.14 + i * 0.28);
    root.add(step);
  }

  // Botonera exterior ▲▼
  const call = withEdges(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.03), dark));
  call.position.set(R + FRAME + 0.22, 1.2, 0.02);
  root.add(call);
  const tri = new THREE.CircleGeometry(0.035, 3);
  const upMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: CHALK, emissiveIntensity: 0.3 });
  const up = new THREE.Mesh(tri, upMat);
  up.name = 'CallUp';
  up.rotation.z = Math.PI / 2;
  up.position.set(0, 0.05, 0.02);
  const down = new THREE.Mesh(tri, upMat.clone());
  down.rotation.z = -Math.PI / 2;
  down.position.set(0, -0.05, 0.02);
  call.add(up, down);

  // Haz de luz con prisma (hacia la izquierda, como en la tapa)
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.6),
    new THREE.MeshBasicMaterial({ map: spillTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  spill.name = NODE.lightSpill;
  spill.position.set(-1.35 - R * 0.2, 1.0, 0.1);
  root.add(spill);

  // ── Cabina ─────────────────────────────────────────────────────────────────────────
  const cabin = new THREE.Group();
  cabin.name = 'Cabin';
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x55524b, roughness: 0.9, side: THREE.FrontSide });
  const addPlane = (w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    cabin.add(m);
    return m;
  };
  const zc = -CABIN.d / 2;
  addPlane(CABIN.w, CABIN.h, [0, CABIN.h / 2, -CABIN.d], [0, 0, 0]); // fondo
  addPlane(CABIN.d, CABIN.h, [-CABIN.w / 2, CABIN.h / 2, zc], [0, Math.PI / 2, 0]); // izquierda
  addPlane(CABIN.d, CABIN.h, [CABIN.w / 2, CABIN.h / 2, zc], [0, -Math.PI / 2, 0]); // derecha
  addPlane(CABIN.w, CABIN.d, [0, 0, zc], [-Math.PI / 2, 0, 0]); // piso
  addPlane(CABIN.w, CABIN.d, [0, CABIN.h, zc], [Math.PI / 2, 0, 0]); // techo

  // aristas de la cabina (dibujo a tiza)
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CABIN.w, CABIN.h, CABIN.d)),
    new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0.35 }),
  );
  edges.position.set(0, CABIN.h / 2, zc);
  cabin.add(edges);

  // Luminaria del techo (su color cambia con cada piso)
  const lamp = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfff2cc, emissiveIntensity: 1.2 }),
  );
  lamp.name = NODE.cabinLamp;
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(0, CABIN.h - 0.01, zc);
  cabin.add(lamp);

  // Cartel del fondo
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.4),
    new THREE.MeshStandardMaterial({ map: signTexture(site.texts.cabinSigns), roughness: 1 }),
  );
  sign.position.set(0, 1.55, -CABIN.d + 0.01);
  cabin.add(sign);

  // Pasamanos
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, CABIN.w - 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x9a968c, metalness: 0.6, roughness: 0.4 }));
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 0.95, -CABIN.d + 0.07);
  cabin.add(rail);

  // Botonera interior (decorativa: la real es HTML accesible)
  const panel = withEdges(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.26), dark));
  panel.position.set(CABIN.w / 2 - 0.02, 1.25, -0.45);
  cabin.add(panel);
  const n = site.tracks.length;
  for (let i = 0; i < n; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000 });
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), m);
    b.name = `${NODE.panelButtons}${i + 1}`;
    b.rotation.y = -Math.PI / 2;
    b.position.set(-0.02, -0.36 + (i * 0.72) / Math.max(1, n - 1), 0);
    panel.add(b);
  }
  root.add(cabin);

  // Piso exterior
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.36;
  ground.position.z = 3;
  root.add(ground);

  return root;
}
