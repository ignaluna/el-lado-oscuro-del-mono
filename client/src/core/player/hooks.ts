import { useStore } from '../store.ts';
import { playerStore, timeStore } from './engine.ts';

export const usePlayer = () => useStore(playerStore);
/** Separado para que solo la barra de progreso se re-renderice con cada `timeupdate`. */
export const usePlayerTime = () => useStore(timeStore);
