import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { startReleaseWatcher } from './core/release.ts';
import './styles/app.css';

startReleaseWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hook solo para pruebas automáticas (no expone nada sensible: el audio igual lo valida el servidor).
if (process.env.NODE_ENV !== 'production' || new URLSearchParams(location.search).has('e2e')) {
  import('./core/player/engine.ts').then((m) => {
    (window as unknown as { __player: unknown }).__player = { audio: m._debugAudio, state: m.playerStore.get };
  });
}
