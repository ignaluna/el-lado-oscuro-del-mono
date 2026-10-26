// Floor 3 · «El lado oscuro del mono» · chapter 3 · the bar Keller (a scenic interpretation, not the real bar).
// The scene repeats: she cries in a corner, the cruel word climbs up. The body warns — heat, tension, the word
// pushing — and naming the warnings in that order, then "Callate." before the word gets out, stops it. Each time
// the word escapes, a glass breaks. Then the pieces are gathered, and under them is the only thing there is: "perdón".
TRIALS['el-lado-oscuro-del-mono'] = {
  approach: 'ACERCARTE A LA BARRA',
  title: 'Una esquina del bar',
  clue: 'A veces el cuerpo avisa.\nCalor. Tensión. La palabra empujando.\n“Callate.”',
  hints: [
    'El cuerpo avisa antes de que la palabra salga. Escuchalo en el orden en que avisa.',
    'Calor, después tensión, después la palabra empujando. Y ahí mismo, antes de que salga…',
    '…«Callate». Después juntá los pedazos que quedaron en la mesa.',
  ],
  done: 'Perdón. No alcanza, ya sé. Pero es lo único que tengo.',
  walkthrough: ['calor', 'tension', 'palabra', 'callate', 'juntar', 'juntar', 'juntar'],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const order = ['calor', 'tension', 'palabra'];
    const svg = T.svg(320, 170, 'La esquina de un bar. Ella llora en un rincón. Sobre la mesa, un vaso.');
    // counter and lamp
    T.el('path', { d: 'M 10 112 H 310 M 10 120 H 310', stroke: AC, 'stroke-width': 1.5, fill: 'none' }, svg);
    T.el('path', { d: 'M 230 0 V 22 M 218 34 L 230 22 L 242 34 Z', stroke: IV, 'stroke-width': 1.2, fill: 'none' }, svg);
    const lamp = T.el('circle', { cx: 230, cy: 40, r: 5, fill: '#ffd9a0', 'fill-opacity': 0.8 }, svg);
    if (!T.reduced) T.el('animate', { attributeName: 'fill-opacity', values: '0.8;0.4;0.85;0.7;0.8', dur: '2.2s', repeatCount: 'indefinite' }, lamp);
    // her, in the corner
    T.el('circle', { cx: 46, cy: 66, r: 9, fill: 'none', stroke: IV, 'stroke-width': 1.3 }, svg);
    T.el('path', { d: 'M 46 75 Q 34 92 36 110 M 46 75 Q 58 92 56 110 M 38 84 Q 46 80 52 70', fill: 'none', stroke: IV, 'stroke-width': 1.3 }, svg);
    T.el('path', { d: 'M 43 67 v 6 M 49 67 v 5', stroke: '#9fc3e0', 'stroke-width': 1 }, svg);
    // the body: three marks that light up
    const marks = order.map((id, i) => T.el('circle', { cx: 150 + i * 22, cy: 30, r: 6, fill: 'none', stroke: IV, 'stroke-width': 1.3 }, svg));
    T.text(svg, 172, 14, 'EL CUERPO', { 'font-size': 9, 'letter-spacing': 2, opacity: 0.7 });
    const word = T.text(svg, 175, 70, '', { 'font-size': 14, 'font-style': 'italic' });
    // the glass and the table where its pieces end up
    const glass = T.el('path', { d: 'M 200 112 L 196 86 H 216 L 212 112 Z', fill: 'none', stroke: IV, 'stroke-width': 1.3 }, svg);
    const shardsG = T.el('g', {}, svg);
    const under = T.text(svg, 130, 150, 'perdón.', { 'font-size': 15, 'font-style': 'italic', opacity: 0 });
    const acts = T.acts();
    let at = 0, broken = 0, stopped = false, gathered = 0;
    const shards = [];
    const addShard = () => {
      const i = shards.length, x = 96 + ((i * 37) % 80), y = 138 + (i % 2) * 12;
      shards.push(T.el('path', { d: `M ${x} ${y} l 9 -5 l 3 9 z`, fill: 'none', stroke: IV, 'stroke-width': 1.2 }, shardsG));
    };
    for (let i = 0; i < 3; i++) addShard(); // what was already broken, before tonight
    const reset = (why) => {
      at = 0; T.progress(0);
      for (const m of marks) m.setAttribute('fill', 'none');
      T.say(why);
    };
    const labels = { tension: 'TENSIÓN', palabra: 'LA PALABRA EMPUJANDO', calor: 'CALOR' }; // shown out of order
    for (const id of ['tension', 'palabra', 'calor']) {
      T.btn(acts, labels[id], id, () => {
        if (stopped) return;
        if (id === order[at]) {
          marks[at].setAttribute('fill', AC); at++; T.progress(at * 0.15);
          T.say(at < 3 ? `${labels[id].charAt(0)}${labels[id].slice(1).toLowerCase()}. El cuerpo avisa.` : 'La palabra está empujando. Ahora.');
          word.textContent = at === 3 ? '«Dejá de…»' : '';
        } else {
          word.textContent = '«Dejá de llorar.»';
          broken++; addShard(); glass.setAttribute('stroke-dasharray', '3 3');
          reset('No llegaste. La palabra salió y algo se rompió. Y pasa otra vez.');
        }
      });
    }
    T.btn(acts, '«CALLATE.»', 'callate', () => {
      if (stopped) return;
      if (at < 3) { T.say('Todavía no sabés qué estás callando. Escuchá primero al cuerpo.'); return; }
      stopped = true; word.textContent = '«Callate.»'; T.progress(0.55);
      T.say('Esta vez llegaste. La palabra no salió. Sobre la mesa quedan los pedazos de antes.');
      gather.hidden = false; gather.focus({ preventScroll: true });
    }, { wide: true });
    const gather = T.btn(acts, 'JUNTAR UN PEDAZO', 'juntar', () => {
      const s = shards[gathered++];
      if (s) s.setAttribute('transform', `translate(${206 - Number(s.getAttribute('d').split(' ')[1])} ${100 - Number(s.getAttribute('d').split(' ')[2])})`);
      T.progress(0.55 + (0.45 * gathered) / shards.length);
      if (gathered < shards.length) { T.say(`${gathered} de ${shards.length}. Los sigo viendo, en caras nuevas.`); return; }
      under.setAttribute('opacity', 1); glass.removeAttribute('stroke-dasharray');
      T.solve();
    }, { wide: true });
    gather.hidden = true;
    T.say(`Hay ${3 + broken} pedazos de vidrio sobre la mesa.`);
  },
};
