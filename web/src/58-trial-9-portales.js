// Floor 9 · «Portales» · chapter 9 · a big tree.
// A big tree and the neighbourhood around it, each sound drawn as rings (nothing needs to be heard). Its four roots
// reach out to where the chapter says something stays — and to the small invisible things of the barrio — not to the
// stages, lights or audiences it no longer needs. With the four roots in place, a portal opens in the trunk.
TRIALS['portales'] = {
  approach: 'ACERCARTE AL ÁRBOL',
  title: 'Un árbol grande',
  clue: 'quiero creer que algo mío va a quedar acá: en la raíz de un árbol, en el ladrido de un perro, en el eco suave de una guitarra que todavía suena.\nAcá lo invisible se nota: en cómo los vecinos se saludan, en la risa compartida sin motivo.',
  hints: [
    'El árbol tiene cuatro raíces. Llevalas a lo que el capítulo quiere que quede.',
    'Algunas cosas del barrio el capítulo ya no las necesita: escenarios, luces, público.',
    'El perro, la guitarra, los vecinos que se saludan y la risa sin motivo.',
  ],
  done: 'Los portales no desaparecen. Se transforman.',
  walkthrough: ['perro', 'guitarra', 'vecinos', 'risa'],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const spots = [
      ['perro', 'UN PERRO QUE LADRA', 34, 132, true], ['guitarra', 'UNA GUITARRA', 286, 132, true], ['vecinos', 'VECINOS QUE SE SALUDAN', 40, 44, true],
      ['escenario', 'UN ESCENARIO', 286, 88, false], ['risa', 'UNA RISA SIN MOTIVO', 280, 44, true], ['luces', 'LUCES', 34, 88, false], ['publico', 'PÚBLICO', 160, 164, false],
    ];
    const svg = T.svg(320, 170, 'Un árbol grande en el centro y, alrededor, cosas del barrio.');
    T.el('path', { d: 'M 152 130 L 154 74 L 166 74 L 168 130', fill: 'none', stroke: '#c9d6b8', 'stroke-width': 1.6 }, svg);
    T.el('path', { d: 'M 160 76 L 136 46 M 160 76 L 186 44 M 148 60 L 128 58 M 174 58 L 196 60 M 160 76 L 160 36', fill: 'none', stroke: '#c9d6b8', 'stroke-width': 1.3 }, svg);
    T.el('ellipse', { cx: 160, cy: 52, rx: 52, ry: 30, fill: 'none', stroke: '#9fbf86', 'stroke-width': 1, 'stroke-dasharray': '2 4' }, svg);
    const portal = T.el('ellipse', { cx: 160, cy: 110, rx: 0, ry: 0, fill: '#f6f3ea', 'fill-opacity': 0.9 }, svg);
    const rootsG = T.el('g', {}, svg);
    for (const [, label, x, y] of spots) {
      const g = T.el('g', {}, svg);
      for (let k = 1; k <= 2; k++) {
        const ring = T.el('circle', { cx: x, cy: y, r: 4 + k * 5, fill: 'none', stroke: IV, 'stroke-width': 1, opacity: 0.5 }, g);
        if (!T.reduced) T.el('animate', { attributeName: 'r', values: `${4 + k * 3};${4 + k * 7};${4 + k * 3}`, dur: `${1.6 + k * 0.4}s`, repeatCount: 'indefinite' }, ring);
      }
      T.el('circle', { cx: x, cy: y, r: 3, fill: IV }, g);
      T.text(svg, x, y + (y > 100 ? -18 : 26), label.length > 14 ? label.split(' ').slice(0, 2).join(' ') : label, { 'font-size': 7.5, 'letter-spacing': 0.5, opacity: 0.85 });
    }
    const roots = {};
    let count = 0;
    const acts = T.acts();
    for (const [id, label, x, y, ok] of spots) {
      const b = T.btn(acts, label, id, () => {
        if (roots[id]) { // take it back
          roots[id].remove(); delete roots[id]; count--; b.setAttribute('aria-pressed', 'false');
          T.progress(count / 4 * 0.9); T.say(`La raíz vuelve al árbol. ${count} de 4.`); return;
        }
        if (!ok) {
          const tmp = T.el('path', { d: `M 160 130 Q ${(160 + x) / 2} ${(130 + y) / 2 + 20} ${x} ${y}`, fill: 'none', stroke: AC, 'stroke-width': 1.5, 'stroke-dasharray': '3 5', opacity: 0.6 }, rootsG);
          T.later(() => tmp.remove(), 900);
          T.say('Hoy no necesito escenarios, ni luces, ni público. La raíz vuelve.');
          return;
        }
        if (count >= 4) { T.say('Las cuatro raíces ya salieron.'); return; }
        roots[id] = T.el('path', { d: `M 160 130 Q ${(160 + x) / 2} ${(130 + y) / 2 + 20} ${x} ${y}`, fill: 'none', stroke: AC, 'stroke-width': 2.2 }, rootsG);
        count++; b.setAttribute('aria-pressed', 'true');
        T.progress(count / 4 * 0.9);
        if (count < 4) { T.say(`Una raíz llega hasta ${label.toLowerCase()}. ${count} de 4.`); return; }
        portal.setAttribute('rx', 9); portal.setAttribute('ry', 16);
        T.solve();
      }, { aria: `Llevar una raíz hasta ${label.toLowerCase()}` });
      b.setAttribute('aria-pressed', 'false');
    }
    T.say('Cuatro raíces esperan.');
  },
};
