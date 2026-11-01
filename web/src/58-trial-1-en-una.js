// Floor 1 · «En una» · chapter 1 · a reality simulated by a computer.
// Screens of automatisms keep the visitor asleep. Waking up is turning them off in the order the chapter wakes:
// the noise, the floor, the mirror. Behind the last one the mono waits; looking at it again (a slow count) solves it.
TRIALS['en-una'] = {
  approach: 'ACERCARTE A LAS PANTALLAS',
  title: 'Las pantallas',
  clue: 'El ruido aturde. El piso tiembla. El espejo no devuelve tu máscara.\nY ya no podés seguir dormido.',
  hints: [
    'Las pantallas te mantienen dormido. Despertar es apagarlas.',
    'El orden está en el fragmento: lo primero que aturde, lo que tiembla después, el espejo al final.',
    'Apagá el ruido, después el piso, después el espejo. Y quedate mirando lo que aparece.',
  ],
  done: 'Lo miraste de nuevo. Te acordaste de quién eras.',
  walkthrough: ['ruido', 'piso', 'espejo', { hold: 'mirar' }],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const order = ['ruido', 'piso', 'espejo'];
    const screens = { espejo: { x: 58, name: 'ESPEJO' }, ruido: { x: 160, name: 'RUIDO' }, piso: { x: 262, name: 'PISO' } }; // as they hang: not in order
    const svg = T.svg(320, 170, 'Tres pantallas encendidas: la del espejo, la del ruido y la del piso.');
    for (const [id, sc] of Object.entries(screens)) {
      const g = T.el('g', {}, svg);
      T.el('rect', { x: sc.x - 44, y: 18, width: 88, height: 64, fill: 'none', stroke: IV, 'stroke-width': 1.6 }, g);
      sc.glow = T.el('rect', { x: sc.x - 41, y: 21, width: 82, height: 58, fill: AC, 'fill-opacity': 0.32 }, g);
      if (!T.reduced) T.el('animate', { attributeName: 'fill-opacity', values: '0.18;0.42;0.24;0.36;0.18', dur: `${1.4 + sc.x / 300}s`, repeatCount: 'indefinite' }, sc.glow);
      if (id === 'ruido') for (let i = 1; i <= 3; i++) T.el('path', { d: `M ${sc.x - 6 + i * 7} ${50 - i * 7} q ${4 + i * 2} ${i * 7} 0 ${i * 14}`, fill: 'none', stroke: IV, 'stroke-width': 1.4 }, g);
      if (id === 'ruido') T.el('path', { d: `M ${sc.x - 16} 44 h 8 l 9 -8 v 28 l -9 -8 h -8 z`, fill: 'none', stroke: IV, 'stroke-width': 1.4 }, g);
      if (id === 'piso') for (let i = 0; i < 4; i++) T.el('path', { d: `M ${sc.x - 30} ${40 + i * 9} l 12 -3 l 12 3 l 12 -3 l 12 3 l 12 -3`, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, g);
      if (id === 'espejo') { T.el('ellipse', { cx: sc.x, cy: 50, rx: 18, ry: 24, fill: 'none', stroke: IV, 'stroke-width': 1.4 }, g); sc.face = T.el('g', { opacity: 0 }, g); }
      T.text(svg, sc.x, 100, sc.name, { 'font-size': 11, 'letter-spacing': 2 });
    }
    { // the mono inside the glass, waiting
      const f = screens.espejo.face, x = screens.espejo.x;
      T.el('circle', { cx: x, cy: 48, r: 11, fill: 'none', stroke: IV, 'stroke-width': 1.3 }, f);
      T.el('circle', { cx: x - 13, cy: 46, r: 4, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, f); T.el('circle', { cx: x + 13, cy: 46, r: 4, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, f);
      T.el('ellipse', { cx: x, cy: 53, rx: 6, ry: 4, fill: 'none', stroke: IV, 'stroke-width': 1.1 }, f);
      T.el('circle', { cx: x - 4, cy: 45, r: 1.4, fill: IV }, f); T.el('circle', { cx: x + 4, cy: 45, r: 1.4, fill: IV }, f);
    }
    const note = T.text(svg, 160, 140, 'La data baja desde arriba.', { 'font-size': 12, opacity: 0.75 });
    const acts = T.acts();
    let at = 0;
    const off = (id, on) => { const g = screens[id].glow; g.setAttribute('fill-opacity', on ? 0.32 : 0.03); g.style.display = on ? '' : 'none'; };
    const btns = {};
    for (const id of Object.keys(screens)) {
      btns[id] = T.btn(acts, `APAGAR ${screens[id].name}`, id, () => {
        if (id === order[at]) {
          off(id, false); btns[id].disabled = true; at++;
          T.step(at); T.progress(at / 4);
          if (at < 3) T.say(`La pantalla del ${id} se apaga.`);
          else { screens.espejo.face.setAttribute('opacity', 1); note.textContent = 'El mono te observa desde adentro del vidrio.'; T.say('Detrás del espejo hay alguien. No te juzga. Solo espera.'); look.hidden = false; look.focus({ preventScroll: true }); }
        } else {
          at = 0; T.step(0); T.progress(0);
          for (const k of order) { off(k, true); btns[k].disabled = false; }
          T.say('Se vuelven a encender todas. El algoritmo ya está escrito.');
        }
      }, { aria: `Apagar la pantalla del ${id}` });
    }
    const look = T.btn(acts, 'MIRARLO DE NUEVO', 'mirar', (b) => {
      T.say('Quedate mirándolo. Sin apuro.');
      T.hold(b, 4000, 'MIRÁNDOLO', () => T.solve(), () => T.say('Apartaste la vista. Él sigue ahí.'));
    }, { wide: true, keepHold: true });
    look.hidden = true;
  },
};
