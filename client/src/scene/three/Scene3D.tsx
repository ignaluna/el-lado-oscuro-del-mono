import { useEffect, useRef } from 'react';
import { site } from '../../../../shared/site.config.ts';
import type { Scene3DCallbacks, SceneProps } from '../types.ts';
import { ElevatorStage } from './ElevatorStage.ts';

/**
 * Puente React ↔ three.js. Este módulo (y three) se descargan en diferido: solo si el
 * dispositivo usa la vista 3D. Desmontarlo no afecta el audio ni el estado de la app.
 */
export default function Scene3D(props: SceneProps & Scene3DCallbacks) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<ElevatorStage | null>(null);
  const cbRef = useRef({ onReady: props.onReady, onFail: props.onFail });
  cbRef.current = { onReady: props.onReady, onFail: props.onFail };

  useEffect(() => {
    const canvas = canvasRef.current!;
    let stage: ElevatorStage;
    try {
      stage = new ElevatorStage(canvas, {
        maxPixelRatio: site.scene.maxPixelRatio,
        modelUrl: site.scene.modelUrl,
        onReady: () => cbRef.current.onReady(),
        onFail: (r) => cbRef.current.onFail(r),
      });
    } catch {
      cbRef.current.onFail('sin WebGL');
      return;
    }
    stageRef.current = stage;
    const ro = new ResizeObserver(([e]) => stage.resize(e.contentRect.width, e.contentRect.height));
    ro.observe(canvas);
    stage.resize(canvas.clientWidth, canvas.clientHeight);
    stage.init().catch((err) => {
      console.error('[escena 3D]', err);
      cbRef.current.onFail('error al iniciar');
    });
    return () => {
      ro.disconnect();
      stage.dispose();
      stageRef.current = null;
    };
  }, []);

  const { onReady: _r, onFail: _f, ...sceneProps } = props;
  useEffect(() => {
    stageRef.current?.update(sceneProps as SceneProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.released,
    props.view,
    props.floorIndex,
    props.previousFloorIndex,
    props.mood,
    props.travelSeq,
    props.playing,
    props.reducedMotion,
    props.layout,
    props.frame,
  ]);

  return <canvas ref={canvasRef} className="stage__canvas" />;
}
