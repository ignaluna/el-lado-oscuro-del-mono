# Escena 3D: cómo reemplazar el ascensor provisional

La escena está aislada en `client/src/scene/`. Recibe **solo** `SceneProps`
(`client/src/scene/types.ts`: estreno, vista, piso, color, viaje, movimiento reducido) y
nunca controla audio, estreno ni formulario. Por eso se puede cambiar, desmontar o reescribir
sin cortar la música.

```
scene/
  SceneHost.tsx        elige 3D o 2D, carga el 3D en diferido, cae a 2D si falla
  types.ts             contrato de props
  two/Scene2D.tsx      alternativa liviana (SVG/CSS)
  three/Scene3D.tsx    puente React ↔ three.js
  three/ElevatorStage.ts  render, cámara guiada, luces, animaciones
  three/placeholder.ts    ascensor provisional (geometrías simples)
  three/rig.ts            contrato de nombres + carga de GLB
```

## Exportar desde Blender (glTF binario `.glb`)

1. Modelar el ascensor con estos **nombres de objeto** (respetar mayúsculas):

   | Nombre | Obligatorio | Uso |
   |---|---|---|
   | `Elevator` | recomendado | raíz del modelo |
   | `Door_L`, `Door_R` | **sí** | hojas de la puerta; se desplazan en X para abrir |
   | `Indicator` | no | la marca "II" (materiales con *Emission*); se enciende al estrenar |
   | `CabinLamp` | no | luminaria del techo (material con *Emission*); toma el color del piso |
   | `PanelButton_1` … `PanelButton_9` | no | botones decorativos de la cabina |
   | `LightSpill` | no | plano del haz de luz / prisma (material transparente) |
   | `DoorSeam` | no | hilo de luz entre las hojas cerradas |
   | `Cam_Lobby`, `Cam_Lobby_Target` | no | *empties* con posición de cámara afuera y su objetivo |
   | `Cam_Doorway` | no | punto intermedio de la entrada |
   | `Cam_Inside`, `Cam_Inside_Target` | no | cámara adentro de la cabina y su objetivo |

2. Puertas: con las hojas **cerradas** en la pose de reposo. El recorrido de apertura es el ancho
   de la hoja; para otro valor, agregar la propiedad personalizada `openOffset` (metros) a `Door_L`
   (Blender → Object Properties → Custom Properties; se exporta como `extras`).
   Un *empty* de cámara acepta `fov` (grados) como propiedad personalizada.
3. Escala real (1 unidad = 1 m), puerta mirando a **+Z**, piso en Y = 0, cabina hacia −Z.
4. Exportar: *File → Export → glTF 2.0*, formato **.glb**, incluir *Custom Properties*,
   aplicar modificadores, compresión Draco **desactivada** (no incluimos el decodificador).
   Texturas ≤ 1024 px (mejor 512) y, si se puede, < 2 MB en total.
5. Copiar a `client/public/models/ascensor.glb` y en `shared/site.config.ts`:
   `scene.modelUrl: '/models/ascensor.glb'`.

Si el GLB falla al cargar, la escena vuelve sola al ascensor provisional (y si el 3D no
funciona en el dispositivo, a la vista 2D).

## Pasar a React Three Fiber

En este MVP la escena está en three.js directo (el entorno donde se programó no podía instalar
paquetes de npm). La correspondencia es 1 a 1:

| Hoy | En R3F |
|---|---|
| `ElevatorStage` (renderer, loop a demanda) | `<Canvas frameloop="demand" dpr={[1, maxPixelRatio]}>` |
| `buildPlaceholder()` / `loadGlb()` | `<Elevator>` con `useGLTF` (drei) o JSX de geometrías |
| `renderFrame()` (puertas, color, viaje) | `useFrame` en `<Elevator>` y `<CabinLights>` |
| cámara guiada + `applyFraming()` | `<CameraRig view layout />` con `useFrame` |
| `update(props)` | props de React |

`SceneHost` sigue igual: solo cambia el `lazy(() => import('./three/Scene3D.tsx'))` por el
componente R3F. Nada de `core/` ni de `ui/` se toca.

## Próximo paso: mundos por piso

`Track.extras` (en `shared/site.config.ts`) ya reserva letras, créditos y videoclip.
La idea es que, al llegar a un piso, `SceneProps` incluya `worldId` y la escena abra las puertas
hacia un escenario propio cargado en diferido (un GLB o módulo por piso), sin tocar el
reproductor.
