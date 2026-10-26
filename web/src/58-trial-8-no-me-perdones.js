// Floor 8 · «No me perdones» · chapter 7 · emptiness.
// Paper castles float in the void, between the visitor and a sign that says META. Running toward it only builds more
// castles. Unfolding them lays a path instead, and the goal fades: there is only the way. At the end of it, a glass of
// water trembles each time a wave breaks; it is put down while the wave pulls back (a long, slow window).
TRIALS['no-me-perdones'] = {
  approach: 'ACERCARTE AL VACÍO',
  title: 'Castillos de papel',
  clue: 'esos castillos de papel que llamé felicidad eran excusas para no detenerme, para no sentir.\nY vos llegaste a decirme, sin palabras, que no hay meta, que solo hay camino.',
  hints: [
    'Correr hacia la meta solo levanta más castillos.',
    'Desarmá los castillos de papel: cada uno se vuelve un tramo del camino.',
    'Al final, el vaso tiembla cuando rompe la ola. Apoyalo cuando la ola se retira.',
  ],
  done: 'El vaso quedó quieto. No hay meta. Solo camino.',
  walkthrough: ['desarmar', 'desarmar', 'desarmar', { act: 'apoyar', when: 'data-ok' }],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const svg = T.svg(320, 170, 'Un vacío con castillos de papel, un cartel que dice META y un vaso de agua.');
    const meta = T.el('g', {}, svg);
    T.el('path', { d: 'M 292 20 V 70 M 292 22 H 316 V 38 H 292', fill: 'none', stroke: IV, 'stroke-width': 1.3 }, meta);
    T.text(meta, 304, 34, 'META', { 'font-size': 7.5, 'letter-spacing': 1 });
    const castlesG = T.el('g', {}, svg);
    const pathG = T.el('g', {}, svg);
    const castles = [];
    const addCastle = () => {
      const i = castles.length, x = 70 + i * 52, y = 66 - (i % 2) * 14;
      castles.push(T.el('path', { d: `M ${x - 16} ${y + 20} V ${y} l 6 -8 l 5 8 l 5 -8 l 5 8 l 6 -8 l 5 8 V ${y + 20} Z`, fill: 'none', stroke: IV, 'stroke-width': 1.3 }, castlesG));
    };
    for (let i = 0; i < 3; i++) addCastle();
    let tiles = 0;
    // the patio: a glass and the waves
    const glass = T.el('g', { transform: 'translate(40 132)' }, svg);
    T.el('path', { d: 'M -9 18 L -11 -10 H 11 L 9 18 Z', fill: 'none', stroke: '#cfe0f0', 'stroke-width': 1.3 }, glass);
    const water = T.el('path', { d: 'M -10 -2 H 10', stroke: AC, 'stroke-width': 1.6 }, glass);
    const wave = T.el('path', { d: 'M 150 160 q 20 -12 40 0 t 40 0 t 40 0 t 40 0', fill: 'none', stroke: IV, 'stroke-width': 1.2, opacity: 0.6 }, svg);
    const acts = T.acts();
    const run = T.btn(acts, 'IR HACIA LA META', 'meta', () => {
      if (castles.length >= 5) { T.say('Ya no entran más castillos. Y la meta sigue igual de lejos.'); return; }
      addCastle(); T.say('Cuanto más corrés, más castillos de papel aparecen. La meta sigue igual de lejos.');
    });
    const unfold = T.btn(acts, 'DESARMAR UN CASTILLO', 'desarmar', () => {
      const c = castles.pop();
      if (!c) return;
      c.remove();
      T.el('rect', { x: 64 + tiles * 44, y: 112, width: 36, height: 6, fill: IV, 'fill-opacity': 0.55 }, pathG);
      tiles++; T.progress(Math.min(0.6, tiles * 0.15));
      if (castles.length) { T.say(`El papel se abre y queda en el piso. Un tramo de camino.${castles.length === 1 ? ' Queda un castillo.' : ` Quedan ${castles.length}.`}`); return; }
      meta.setAttribute('opacity', 0.15); run.hidden = true; unfold.hidden = true;
      T.progress(0.65);
      T.say('No hay meta. Solo camino. Al final del camino, en el patio, un vaso de agua tiembla.');
      startWaves(); put.hidden = false; put.focus({ preventScroll: true });
    });
    // the waves: about 4 s each, breaking (1.6 s) then pulling back (2.4 s) — said in words on the button too
    let breaking = true;
    const setPhase = (b) => {
      breaking = b;
      wave.setAttribute('transform', b ? 'translate(-60 -10)' : 'translate(0 0)');
      water.setAttribute('transform', b ? 'rotate(10)' : 'rotate(0)');
      glass.setAttribute('transform', b ? 'translate(41 131)' : 'translate(40 132)');
      put.textContent = b ? 'APOYAR EL VASO · LA OLA ROMPE' : 'APOYAR EL VASO · LA OLA SE RETIRA';
      put.dataset.ok = b ? '0' : '1';
    };
    const startWaves = () => { const cycle = () => { setPhase(true); T.later(() => { setPhase(false); T.later(cycle, 2400); }, 1600); }; cycle(); };
    const put = T.btn(acts, 'APOYAR EL VASO', 'apoyar', () => {
      if (breaking) { T.say('Las olas rompen, pero no calman. El vaso tiembla en tu mano.'); return; }
      T.progress(1); T.solve();
    }, { wide: true });
    put.hidden = true;
    T.say('Tres castillos de papel entre vos y la meta.');
  },
};
