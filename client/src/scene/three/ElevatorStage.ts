import * as THREE from 'three';
import type { SceneProps } from '../types.ts';
import { BG, buildPlaceholder } from './placeholder.ts';
import { buildRig, computeFacadeBounds, loadGlb, type ElevatorRig, type Pose } from './rig.ts';

/**
 * Escena 3D del ascensor (three.js, sin dependencias extra).
 *
 * - Recibe `SceneProps` con update() y anima hacia ese estado. Nunca decide nada de la app.
 * - Render bajo demanda: con movimiento reducido solo dibuja cuando algo cambia; si no,
 *   anima a ~30 fps y se pausa sola con la pestaña oculta.
 * - Resolución limitada (maxPixelRatio) y degradación automática si el equipo va lento.
 *
 * Portar a React Three Fiber: esta clase equivale a un <Canvas> + componentes <Elevator>,
 * <CameraRig> y <Lights>; ver docs/MODELO-3D.md.
 */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export class ElevatorStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);
  private rig!: ElevatorRig;
  private cabinLight = new THREE.PointLight(0xfff2cc, 0, 6, 1.4);
  private spillLight = new THREE.PointLight(0xfff4d6, 0, 7, 1.6);
  private keyLight = new THREE.SpotLight(0xdad6ff, 18, 14, 0.55, 0.7, 1.2);
  private dust: THREE.Points | null = null;

  private props: SceneProps | null = null;
  private raf = 0;
  private last = 0;
  private disposed = false;
  private size = { w: 1, h: 1 };
  private maxDpr: number;

  // estado animado
  private doorOpen = 0; // 0 cerrado · 1 abierto
  private doorTarget = 0;
  private enterStart = -1; // ms, -1 = sin transición
  private travelStart = -1;
  private travelDir = 1;
  private moodColor = new THREE.Color(0xfff2cc);
  private moodTarget = new THREE.Color(0xfff2cc);
  private prisma = false;
  private camPose: Pose;
  private invalidated = true;
  /** Ancho/alto de la fachada del ascensor (unidades del mundo); se mide una vez tras cargar el modelo. */
  private facade = { width: 1.6, height: 2.6 };

  // rendimiento
  private slowFrames = 0;
  private measured = 0;
  private degraded = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: { maxPixelRatio: number; modelUrl: string | null; onReady: () => void; onFail: (r: string) => void },
  ) {
    this.maxDpr = opts.maxPixelRatio;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: 'default', alpha: false });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color(BG);
    this.scene.fog = new THREE.Fog(BG, 11, 24);
    this.camPose = { pos: new THREE.Vector3(0, 1.35, 6.2), target: new THREE.Vector3(0, 1.2, 0), fov: 40 };

    canvas.addEventListener('webglcontextlost', this.onContextLost, false);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.opts.onFail('contexto WebGL perdido');
  };

  async init() {
    let root: THREE.Object3D;
    try {
      root = this.opts.modelUrl ? await loadGlb(this.opts.modelUrl) : buildPlaceholder();
    } catch (err) {
      console.warn('[escena] No se pudo cargar el GLB; uso el ascensor provisional.', err);
      root = buildPlaceholder();
    }
    if (this.disposed) return;
    this.rig = buildRig(root);
    this.scene.add(root);
    root.updateMatrixWorld(true);
    this.facade = computeFacadeBounds(root);

    // Luces
    this.scene.add(new THREE.AmbientLight(0x8890a8, 0.35));
    this.keyLight.position.set(1.5, 5.5, 4.5);
    this.keyLight.target.position.set(0, 1.1, 0);
    this.scene.add(this.keyLight, this.keyLight.target);
    this.cabinLight.position.set(0, 2.6, -0.95);
    this.scene.add(this.cabinLight);
    this.spillLight.position.set(-0.2, 1.2, 0.6);
    this.scene.add(this.spillLight);

    this.addDust();
    this.camPose = {
      pos: this.rig.poses.lobby.pos.clone(),
      target: this.rig.poses.lobby.target.clone(),
      fov: this.rig.poses.lobby.fov,
    };
    if (this.props) this.update(this.props, true);
    this.renderFrame(performance.now());
    this.opts.onReady();
    this.loop();
  }

  private addDust() {
    const n = 110;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = Math.random() * 2.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: 0xfff4d6, size: 0.014, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    this.scene.add(this.dust);
  }

  /** Sincroniza con el estado de la app. `snap` = sin animación (montaje o movimiento reducido). */
  update(p: SceneProps, snap = false) {
    const prev = this.props;
    this.props = p;
    if (!this.rig) return;
    const instant = snap || p.reducedMotion;

    // Puertas
    this.doorTarget = p.view === 'lobby' ? (p.released ? 0.08 : 0) : 1;
    if (instant) this.doorOpen = this.doorTarget;

    // Entrada (cámara guiada, sin navegación libre)
    if (p.view === 'entering' && prev?.view !== 'entering' && !instant) this.enterStart = performance.now();
    if (p.view === 'inside' && (instant || this.enterStart < 0)) this.setPose(this.rig.poses.inside);
    if (p.view === 'lobby') {
      this.enterStart = -1;
      this.setPose(this.rig.poses.lobby);
    }
    if (p.view === 'entering' && instant) this.setPose(this.rig.poses.inside);

    // Color del piso
    const m = p.mood;
    this.prisma = m?.special === 'prisma';
    this.moodTarget.set(m ? m.color : 0xfff2cc);
    if (instant) this.moodColor.copy(this.moodTarget);

    // Viaje entre pisos (no bloquea nada: el audio ya está sonando)
    if (prev && p.travelSeq !== prev.travelSeq && p.view !== 'lobby' && !p.reducedMotion) {
      this.travelStart = performance.now();
      this.travelDir = p.previousFloorIndex !== null && p.floorIndex !== null && p.floorIndex < p.previousFloorIndex ? -1 : 1;
    }

    // Botones del panel 3D
    this.rig.panelMats.forEach((mat, i) => {
      const on = p.floorIndex === i;
      mat.emissive.set(on ? this.moodTarget : 0x000000);
      mat.emissiveIntensity = on ? 2 : 0;
    });

    if (this.dust) this.dust.visible = !p.reducedMotion;
    this.invalidate();
  }

  private setPose(p: Pose) {
    this.camPose = { pos: p.pos.clone(), target: p.target.clone(), fov: p.fov };
  }

  invalidate() {
    this.invalidated = true;
    if (!this.raf && !this.disposed) this.loop();
  }

  resize(w: number, h: number) {
    this.size = { w: Math.max(1, w), h: Math.max(1, h) };
    this.renderer.setSize(this.size.w, this.size.h, false);
    this.invalidate();
  }

  private loop = () => {
    this.raf = requestAnimationFrame((t) => {
      this.raf = 0;
      if (this.disposed) return;
      const animating = this.isAnimating(t);
      const idleAnim = this.props && !this.props.reducedMotion;
      // ~30 fps en reposo animado; 60 fps durante transiciones
      const minDelta = animating ? 0 : 1000 / 30;
      if (this.invalidated || animating || (idleAnim && t - this.last >= minDelta)) {
        this.renderFrame(t);
        this.invalidated = false;
      }
      if (animating || idleAnim || this.invalidated) this.loop();
    });
  };

  private isAnimating(t: number) {
    const doorsMoving = Math.abs(this.doorOpen - this.doorTarget) > 0.001;
    const entering = this.enterStart >= 0 && t - this.enterStart < 1700;
    const traveling = this.travelStart >= 0 && t - this.travelStart < 900;
    const colorMoving =
      Math.abs(this.moodColor.r - this.moodTarget.r) + Math.abs(this.moodColor.g - this.moodTarget.g) + Math.abs(this.moodColor.b - this.moodTarget.b) >
      0.004;
    return doorsMoving || entering || traveling || colorMoving || this.prisma;
  }

  private renderFrame(t: number) {
    const dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0.016;
    this.watchPerformance(t - this.last);
    this.last = t;
    const p = this.props;
    const r = this.rig;
    if (!r || !p) return;

    // Puertas (amortiguado)
    this.doorOpen += (this.doorTarget - this.doorOpen) * Math.min(1, dt * (p.view === 'entering' ? 6 : 3));
    r.doorL.position.x = r.doorLClosed.x - r.doorTravel * this.doorOpen;
    r.doorR.position.x = r.doorRClosed.x + r.doorTravel * this.doorOpen;

    // Color del piso (transición suave) + prisma
    if (this.prisma && !p.reducedMotion) this.moodTarget.setHSL(((t / 9000) % 1 + 1) % 1, 0.75, 0.68);
    this.moodColor.lerp(this.moodTarget, Math.min(1, dt * 2.5));
    const inside = p.view !== 'lobby';
    const breath = p.playing && !p.reducedMotion ? 0.12 * Math.sin(t / 700) : 0;
    this.cabinLight.color.copy(this.moodColor);
    this.cabinLight.intensity = inside ? 3.2 + breath * 6 : this.doorOpen * 3;
    if (r.lampMat) {
      r.lampMat.emissive.copy(this.moodColor);
      r.lampMat.emissiveIntensity = 1.4 + breath;
    }

    // Marca "II": tenue antes del estreno, encendida después
    const flicker = !p.reducedMotion && Math.random() < 0.012 ? 0.4 : 1;
    r.indicatorMats.forEach((m) => {
      m.emissiveIntensity = (p.released ? 1.6 : 0.35) * flicker;
    });
    if (r.seam) (r.seam.material as THREE.MeshBasicMaterial).opacity = (p.released ? 0.9 : 0.18) * flicker * Math.max(0, 1 - this.doorOpen * 4);

    // Haz de luz / prisma
    const spillAmt = p.released ? 0.35 + 0.65 * this.doorOpen : 0;
    if (r.spill) (r.spill.material as THREE.MeshBasicMaterial).opacity = spillAmt * (inside ? Math.max(0, 1 - this.doorOpen * 1.3) : 1);
    this.spillLight.intensity = spillAmt * 3;
    this.spillLight.color.copy(this.moodColor).lerp(new THREE.Color(0xfff4d6), 0.6);

    // Cámara
    let pose = this.camPose;
    if (this.enterStart >= 0) {
      const k = (t - this.enterStart) / 1600;
      if (k >= 1) {
        this.enterStart = -1;
        this.setPose(r.poses.inside);
        pose = this.camPose;
      } else {
        const a = r.poses.lobby;
        const b = r.poses.doorway;
        const c = r.poses.inside;
        const k1 = ease(clamp01((k - 0.2) / 0.45));
        const k2 = ease(clamp01((k - 0.62) / 0.38));
        const pos = a.pos.clone().lerp(b.pos, k1).lerp(c.pos, k2);
        const target = a.target.clone().lerp(b.target, k1).lerp(c.target, k2);
        pose = { pos, target, fov: a.fov + (b.fov - a.fov) * k1 + (c.fov - b.fov) * k2 };
      }
    }
    const cam = this.camera;
    cam.position.copy(pose.pos);
    // Efecto de viaje: pequeña sacudida y barrido de luz
    if (this.travelStart >= 0) {
      const k = (t - this.travelStart) / 850;
      if (k >= 1) this.travelStart = -1;
      else {
        const amp = 0.012 * (1 - k);
        cam.position.y += Math.sin(k * 40) * amp;
        this.cabinLight.intensity *= 0.75 + 0.25 * Math.abs(Math.cos(k * Math.PI * 3));
        this.cabinLight.position.y = 2.6 - this.travelDir * Math.sin(k * Math.PI) * 0.8;
      }
    } else this.cabinLight.position.y = 2.6;
    cam.fov = pose.fov;
    this.applyFraming(p.layout, p.view, p.frame, pose);
    cam.lookAt(pose.target);

    // Polvo en suspensión
    if (this.dust && this.dust.visible) {
      const a = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * 0.05;
        if (y > 3) y = 0;
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t / 2000 + i) * dt * 0.01);
      }
      a.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /** Encuadre: en celular el ascensor va arriba (abajo está el formulario); en escritorio, a la izquierda. */
  private applyFraming(layout: SceneProps['layout'], view: SceneProps['view'], frame: SceneProps['frame'], pose: Pose) {
    const { w, h } = this.size;
    const cam = this.camera;
    cam.aspect = w / h;
    if (view === 'lobby' || view === 'entering') {
      const fade = view === 'entering' && this.enterStart >= 0 ? 1 - clamp01((performance.now() - this.enterStart) / 700) : 1;
      if (layout === 'mobile') {
        if (frame && frame.height > 0) {
          // Encuadramos contra el rect real del stage-window (medido por el Lobby) en vez de
          // asumir que el header entra en ~7vh: alejamos la cámara lo que haga falta para que
          // el ascensor entre en el hueco, y desplazamos verticalmente la vista para centrarlo ahí.
          const TARGET_FRACTION = 0.88;
          const tanHalfFov = Math.tan((cam.fov * Math.PI) / 360);
          const distForHeight = (this.facade.height * h) / (TARGET_FRACTION * frame.height * 2 * tanHalfFov);
          const distForWidth = this.facade.width / (TARGET_FRACTION * 2 * tanHalfFov * cam.aspect);
          const distNeeded = Math.max(distForHeight, distForWidth);
          const baseDist = pose.pos.z - pose.target.z;
          const rawFactor = baseDist > 0 ? distNeeded / baseDist : 1;
          const clampedFactor = Math.min(3.5, Math.max(1, rawFactor));
          const factor = 1 + (clampedFactor - 1) * fade; // vuelve a neutro (1) cuando fade → 0
          cam.position.z = pose.target.z + baseDist * factor;

          const frameCenterY = frame.top + frame.height / 2;
          cam.setViewOffset(w, h, 0, (h / 2 - frameCenterY) * fade, w, h);
        } else {
          // Sin medición del stage-window: comportamiento previo (asume header ~7vh).
          const portrait = w / h < 0.8;
          if (portrait) cam.position.z *= 1 + 0.9 * fade;
          cam.setViewOffset(w, h, 0, h * 0.2 * fade, w, h);
        }
      } else {
        cam.setViewOffset(w, h, w * 0.2 * fade, 0, w, h);
      }
    } else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }

  private watchPerformance(delta: number) {
    if (this.measured > 400) return; // ya sabemos que anda bien
    if (document.visibilityState !== 'visible' || delta <= 0 || delta > 1000) return;
    this.measured++;
    if (delta > 55) this.slowFrames++;
    if (this.measured < 120) return;
    if (this.slowFrames <= 60) {
      this.measured = 401;
      return;
    }
    if (!this.degraded) {
      // primer intento: bajar resolución y volver a medir
      this.degraded = true;
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(this.size.w, this.size.h, false);
      this.measured = 0;
      this.slowFrames = 0;
    } else {
      this.measured = 401;
      this.opts.onFail('rendimiento bajo');
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        (mat as THREE.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      });
    });
    this.renderer.dispose();
  }
}
