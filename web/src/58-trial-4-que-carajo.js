// Floor 4 · «¿Qué carajo?» · chapter 4 · a dove.
// A backpack full of things, a few one's own, many more inherited; a dove that never lands while everything rushes.
// Dragging the backpack along scares it away. Taking each thing out and holding it with both hands — left and right,
// together — brings the dove one step closer; with the five held, it lands.
TRIALS['que-carajo'] = {
  approach: 'ACERCARTE A LA PALOMA',
  title: 'La paloma y la mochila',
  clue: 'Pero pesa distinto cuando lo miro de cerca, cuando lo sostengo con las dos manos en vez de arrastrarlo por la vida.',
  hints: [
    'Arrastrar la mochila espanta a la paloma. Abrila y mirá lo que hay adentro.',
    'Elegí una cosa y sostenela: con una mano no alcanza.',
    'Una por una: elegila, y apretá MANO IZQUIERDA y MANO DERECHA. Son cinco.',
  ],
  done: 'La paloma bajó. No para buscar el sentido: para sentirlo.',
  walkthrough: ['cosa-0', 'izquierda', 'derecha', 'cosa-1', 'izquierda', 'derecha', 'cosa-2', 'izquierda', 'derecha', 'cosa-3', 'izquierda', 'derecha', 'cosa-4', 'izquierda', 'derecha'],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const things = ['Las bolsitas de residuo que vendía papá', 'Las zapatillas que compartían mi vieja y mi tía', 'La espada de Pepe', 'Los ñoquis de Eva', 'Los vinos de Rolando'];
    const svg = T.svg(320, 160, 'Una mochila abierta y una paloma que vuela sin posarse.');
    T.el('path', { d: 'M 120 150 L 116 92 Q 160 76 204 92 L 200 150 Z M 140 92 Q 160 66 180 92', fill: 'none', stroke: AC, 'stroke-width': 1.6 }, svg);
    const slots = things.map((_, i) => T.el('circle', { cx: 130 + i * 15, cy: 120, r: 5, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, svg));
    const hands = T.el('path', { d: 'M 230 132 q 14 10 28 0 M 230 132 q -4 -8 4 -12 M 258 132 q 4 -8 -4 -12', fill: 'none', stroke: IV, 'stroke-width': 1.3, opacity: 0.35 }, svg);
    const dove = T.el('g', {}, svg);
    T.el('path', { d: 'M -14 0 Q 0 -6 12 -2 L 18 -5 L 14 1 Q 0 8 -14 0 Z M -2 -3 L -10 -16 M 2 -3 L 6 -15', fill: 'none', stroke: '#f4f2ec', 'stroke-width': 1.4 }, dove);
    const perches = [[46, 30], [286, 40], [70, 70], [262, 84], [214, 104], [244, 118]]; // far → on the hands
    let near = 0, held = 0, pick = -1;
    const place = () => { const [x, y] = perches[Math.min(near, perches.length - 1)]; dove.setAttribute('transform', `translate(${x} ${y})`); T.progress(held / things.length * 0.95); };
    if (!T.reduced) { // it does not land while it is far: a small flutter
      const fl = T.el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;0 -4;0 0', dur: '0.5s', repeatCount: 'indefinite', additive: 'sum' }, dove);
      dove.flutter = fl;
    }
    place();
    const acts = T.acts();
    const items = things.map((name, i) => T.btn(acts, name.toUpperCase(), 'cosa-' + i, () => {
      if (items[i].classList.contains('done')) return;
      pick = i; for (const b of items) b.setAttribute('aria-pressed', String(b === items[i]));
      left.setAttribute('aria-pressed', 'false'); right.setAttribute('aria-pressed', 'false'); hands.setAttribute('opacity', 0.35);
      T.say(`${name}. Lo sacás de la mochila. ¿Cómo lo sostenés?`);
    }, { wide: i === 4 }));
    const handActs = T.acts();
    const tryHold = () => {
      const l = left.getAttribute('aria-pressed') === 'true', r = right.getAttribute('aria-pressed') === 'true';
      hands.setAttribute('opacity', l && r ? 1 : l || r ? 0.6 : 0.35);
      if (pick < 0) { T.say('Primero sacá algo de la mochila.'); left.setAttribute('aria-pressed', 'false'); right.setAttribute('aria-pressed', 'false'); hands.setAttribute('opacity', 0.35); return; }
      if (!(l && r)) { T.say('Con una sola mano se sigue arrastrando.'); return; }
      const b = items[pick];
      b.classList.add('done'); b.disabled = true; b.setAttribute('aria-pressed', 'false'); b.textContent = '✓ ' + b.textContent;
      slots[pick].setAttribute('fill', AC);
      held++; near = held; pick = -1; place();
      left.setAttribute('aria-pressed', 'false'); right.setAttribute('aria-pressed', 'false');
      if (held < things.length) { T.say('Pesa distinto cuando lo mirás de cerca. La paloma se acerca un poco.'); return; }
      if (dove.flutter) dove.flutter.remove();
      T.solve();
    };
    const left = T.btn(handActs, 'MANO IZQUIERDA', 'izquierda', () => { left.setAttribute('aria-pressed', String(left.getAttribute('aria-pressed') !== 'true')); tryHold(); });
    const right = T.btn(handActs, 'MANO DERECHA', 'derecha', () => { right.setAttribute('aria-pressed', String(right.getAttribute('aria-pressed') !== 'true')); tryHold(); });
    T.btn(handActs, 'ARRASTRAR LA MOCHILA', 'arrastrar', () => {
      near = 0; place(); pick = -1;
      for (const b of items) b.setAttribute('aria-pressed', 'false');
      T.say('Apurados, para alcanzar al de adelante. La paloma se va lejos. Lo que ya sostuviste sigue con vos.');
    }, { wide: true });
    for (const b of [left, right]) b.setAttribute('aria-pressed', 'false');
  },
};
