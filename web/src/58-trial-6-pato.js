// Floor 6 · «Pato» · chapter 5 · a duck.
// A house built in two, brick by brick. Before each brick the Pato shows how he is: turned away (closed) or looking
// at you (open). Ceding when he closes and asking when he opens lays the brick; the other way it does not settle —
// nothing is lost, it is tried again. There is a little more ceding than asking, as the chapter says.
TRIALS['pato'] = {
  approach: 'ACERCARTE AL PATO',
  title: 'Una casa de a dos',
  clue: 'Me interesa la paz, esa que se construye de a dos, en silencio, cediendo, y pidiendo.\nUn poco más cediendo',
  hints: [
    'Mirá al Pato antes de poner cada ladrillo: no siempre está igual.',
    'Cuando se cierra no se discute: se cede. Cuando te mira, podés pedir.',
    'Te da la espalda: CEDER. Te mira: PEDIR.',
  ],
  done: 'Nuestra casa, nuestro fuego.',
  walkthrough: ['ceder', 'pedir', 'ceder', 'ceder', 'pedir', 'ceder', 'ceder'],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const moods = ['cerrado', 'abierto', 'cerrado', 'cerrado', 'abierto', 'cerrado', 'cerrado'];
    const svg = T.svg(320, 170, 'Un pato junto a una casa a medio construir.');
    // the house, seven bricks and a roof
    const bricks = [[150, 140], [190, 140], [230, 140], [170, 122], [210, 122], [190, 104], [190, 86]].map(([x, y]) =>
      T.el('rect', { x: x - 18, y: y - 8, width: 36, height: 16, fill: 'none', stroke: AC, 'stroke-width': 1.3, 'stroke-dasharray': '3 4', opacity: 0.4 }, svg));
    const roof = T.el('path', { d: 'M 136 82 L 190 52 L 244 82', fill: 'none', stroke: AC, 'stroke-width': 1.6, opacity: 0 }, svg);
    const fire = T.el('path', { d: 'M 190 136 q -6 -8 0 -16 q 6 8 0 16 z', fill: '#ff9a4a', opacity: 0 }, svg);
    // the Pato
    const duck = T.el('g', { transform: 'translate(64 128)' }, svg);
    const open = T.el('path', { d: 'M -26 10 H 18 Q 26 4 18 -2 L 14 -2 Q 18 -18 6 -22 Q -6 -22 -4 -8 L -16 -6 Q -26 0 -26 10 Z M 2 -14 h 0.1 M 6 -18 L 14 -16 L 6 -13', fill: 'none', stroke: '#f3d27a', 'stroke-width': 1.6 }, duck);
    const closed = T.el('path', { d: 'M 26 10 H -18 Q -26 4 -18 -2 L -14 -2 Q -18 -18 -6 -22 Q 6 -22 4 -8 L 16 -6 Q 26 0 26 10 Z M -2 -6 L 10 -2 M -2 -2 L 10 2', fill: 'none', stroke: '#f3d27a', 'stroke-width': 1.6 }, duck);
    const moodText = T.text(svg, 64, 162, '', { 'font-size': 10.5 });
    let at = 0;
    const show = () => {
      const m = moods[Math.min(at, moods.length - 1)];
      open.style.display = m === 'abierto' ? '' : 'none'; closed.style.display = m === 'cerrado' ? '' : 'none';
      moodText.textContent = at >= moods.length ? 'Se sienta al lado.' : m === 'abierto' ? 'El Pato te mira.' : 'El Pato te da la espalda.';
      svg.setAttribute('aria-label', `Un pato junto a una casa con ${at} de 7 ladrillos. ${moodText.textContent}`);
    };
    show();
    const acts = T.acts();
    const lay = (choice) => {
      if (at >= moods.length) return;
      const want = moods[at] === 'cerrado' ? 'ceder' : 'pedir';
      if (choice !== want) {
        T.say(choice === 'pedir' ? 'Pediste mientras él se cerraba. El ladrillo no asienta.' : 'Cediste cuando él estaba abierto a escuchar. El ladrillo queda flojo.');
        const b = bricks[at]; b.setAttribute('opacity', 0.9);
        T.later(() => { if (at < bricks.length && bricks[at] === b) b.setAttribute('opacity', 0.4); }, 700);
        return;
      }
      const b = bricks[at];
      b.removeAttribute('stroke-dasharray'); b.setAttribute('opacity', 1); b.setAttribute('fill', AC); b.setAttribute('fill-opacity', 0.2);
      at++; T.progress(at / moods.length * 0.95);
      show();
      if (at < moods.length) { T.say(`${choice === 'ceder' ? 'Cediste.' : 'Pediste.'} El ladrillo asienta. ${moodText.textContent}`); return; }
      roof.setAttribute('opacity', 1); fire.setAttribute('opacity', 0.9);
      duck.setAttribute('transform', 'translate(112 128)');
      T.solve();
    };
    T.btn(acts, 'CEDER', 'ceder', () => lay('ceder'));
    T.btn(acts, 'PEDIR', 'pedir', () => lay('pedir'));
    T.say(`Siete ladrillos. Uno por vez. ${moodText.textContent}`);
  },
};
