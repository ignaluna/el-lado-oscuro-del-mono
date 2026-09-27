import * as THREE from 'three';

/**
 * CONTRATO DEL MODELO 3D
 * ─────────────────────
 * La escena no depende de cómo se construyó el ascensor: busca objetos por NOMBRE.
 * El ascensor provisional (placeholder.ts) y un futuro GLB exportado desde Blender tienen que
 * usar estos nombres (ver docs/MODELO-3D.md).
 */
export const NODE = {
  root: 'Elevator',
  doorLeft: 'Door_L',
  doorRight: 'Door_R',
  indicator: 'Indicator', // la marca "II" sobre la puerta (materiales emisivos)
  cabinLamp: 'CabinLamp', // luminaria del techo de la cabina (material emisivo)
  panelButtons: 'PanelButton_', // PanelButton_1 … PanelButton_9 (opcional)
  lightSpill: 'LightSpill', // haz de luz / prisma que sale por la puerta (opcional)
  seam: 'DoorSeam', // hilo de luz entre las puertas cerradas (opcional)
  camLobby: 'Cam_Lobby', // empties opcionales para las posiciones de cámara
  camDoorway: 'Cam_Doorway',
  camInside: 'Cam_Inside',
  camInsideTarget: 'Cam_Inside_Target',
  camLobbyTarget: 'Cam_Lobby_Target',
} as const;

export type Pose = { pos: THREE.Vector3; target: THREE.Vector3; fov: number };

export type ElevatorRig = {
  root: THREE.Object3D;
  doorL: THREE.Object3D;
  doorR: THREE.Object3D;
  doorLClosed: THREE.Vector3;
  doorRClosed: THREE.Vector3;
  /** Desplazamiento en X para abrir del todo cada hoja. */
  doorTravel: number;
  indicatorMats: THREE.MeshStandardMaterial[];
  lampMat: THREE.MeshStandardMaterial | null;
  panelMats: THREE.MeshStandardMaterial[];
  spill: THREE.Mesh | null;
  seam: THREE.Mesh | null;
  poses: { lobby: Pose; doorway: Pose; inside: Pose };
};

function emissiveMats(o: THREE.Object3D | undefined): THREE.MeshStandardMaterial[] {
  const out: THREE.MeshStandardMaterial[] = [];
  o?.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (m && 'emissive' in m) out.push(m);
  });
  return out;
}

const DEFAULT_POSES = {
  lobby: { pos: new THREE.Vector3(0, 1.35, 6.2), target: new THREE.Vector3(0, 1.2, 0), fov: 40 },
  doorway: { pos: new THREE.Vector3(0, 1.5, 1.1), target: new THREE.Vector3(0, 1.45, -1), fov: 52 },
  inside: { pos: new THREE.Vector3(0, 1.55, -0.2), target: new THREE.Vector3(0, 1.5, -1.8), fov: 62 },
};

/** Arma el "rig" a partir de cualquier escena que respete el contrato de nombres. */
export function buildRig(root: THREE.Object3D): ElevatorRig {
  const get = (name: string) => root.getObjectByName(name);
  const doorL = get(NODE.doorLeft);
  const doorR = get(NODE.doorRight);
  if (!doorL || !doorR) throw new Error(`El modelo no tiene "${NODE.doorLeft}" y "${NODE.doorRight}"`);

  const box = new THREE.Box3().setFromObject(doorL);
  const width = box.max.x - box.min.x;
  const travel = typeof doorL.userData.openOffset === 'number' ? doorL.userData.openOffset : width * 0.95;

  const pose = (name: string, targetName: string, fallback: Pose): Pose => {
    const p = get(name);
    const t = get(targetName);
    return p
      ? {
          pos: p.getWorldPosition(new THREE.Vector3()),
          target: t ? t.getWorldPosition(new THREE.Vector3()) : fallback.target.clone(),
          fov: typeof p.userData.fov === 'number' ? p.userData.fov : fallback.fov,
        }
      : { pos: fallback.pos.clone(), target: fallback.target.clone(), fov: fallback.fov };
  };

  const panelMats: THREE.MeshStandardMaterial[] = [];
  for (let i = 1; i <= 20; i++) {
    const b = get(`${NODE.panelButtons}${i}`) as THREE.Mesh | undefined;
    if (!b) break;
    panelMats.push(b.material as THREE.MeshStandardMaterial);
  }

  return {
    root,
    doorL,
    doorR,
    doorLClosed: doorL.position.clone(),
    doorRClosed: doorR.position.clone(),
    doorTravel: travel,
    indicatorMats: emissiveMats(get(NODE.indicator)),
    lampMat: (emissiveMats(get(NODE.cabinLamp))[0] as THREE.MeshStandardMaterial) ?? null,
    panelMats,
    spill: (get(NODE.lightSpill) as THREE.Mesh) ?? null,
    seam: (get(NODE.seam) as THREE.Mesh) ?? null,
    poses: {
      lobby: pose(NODE.camLobby, NODE.camLobbyTarget, DEFAULT_POSES.lobby),
      doorway: pose(NODE.camDoorway, NODE.camInsideTarget, DEFAULT_POSES.doorway),
      inside: pose(NODE.camInside, NODE.camInsideTarget, DEFAULT_POSES.inside),
    },
  };
}

/** Carga un GLB (solo si está configurado). GLTFLoader se descarga recién acá. */
export async function loadGlb(url: string): Promise<THREE.Object3D> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene.getObjectByName(NODE.root) ?? gltf.scene;
  return root;
}
