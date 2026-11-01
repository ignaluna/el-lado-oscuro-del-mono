// Floor 2 · «¿Qué te está pasando?» · chapter 2 · the system.
// A machine pours money, success, love and substances into a hole that never fills. Pouring more changes nothing;
// closing the four chutes leaves the hole quiet, and staying there — breathing in and out, at your own pace — solves it.
TRIALS['que-te-esta-pasando'] = {
  approach: 'ACERCARTE AL SISTEMA',
  title: 'El sistema',
  clue: 'Nos obligan a llenarlo. Con plata, con éxito, con amor, con sustancias.\nPero no se llena.\nSe habita.',
  hints: [
    'Por más que entre, el hueco no se llena. Mirá la aguja.',
    'Cerrá lo que lo alimenta, uno por uno.',
    'Con todo cerrado, quedate ahí: inhalá y exhalá, sin apuro, hasta volver.',
  ],
  done: 'Ahí, de a poco, volviste.',
  walkthrough: ['cerrar-plata', 'cerrar-exito', 'cerrar-amor', 'cerrar-sustancias', 'inhalar', 'exhalar', 'inhalar', 'exhalar', 'inhalar', 'exhalar'],
  build(T) {
    const IV = '#ebe5d5', AC = T.track.visualAccent;
    const chutes = [['plata', 'PLATA'], ['exito', 'ÉXITO'], ['amor', 'AMOR'], ['sustancias', 'SUSTANCIAS']];
    const svg = T.svg(320, 180, 'Una máquina con cuatro bocas que vierten en un hueco: plata, éxito, amor y sustancias.');
    const open = {}, streams = {};
    chutes.forEach(([id, name], i) => {
      const x = 52 + i * 72;
      T.el('path', { d: `M ${x - 14} 18 h 28 l -8 26 h -12 z`, fill: 'none', stroke: IV, 'stroke-width': 1.4 }, svg);
      T.text(svg, x, 12, name, { 'font-size': 9.5, 'letter-spacing': 1.5 });
      streams[id] = T.el('path', { d: `M ${x} 46 Q ${x + (160 - x) * 0.3} 92 ${160 + (x - 160) * 0.18} 118`, fill: 'none', stroke: AC, 'stroke-width': 3, 'stroke-dasharray': '4 6', 'stroke-opacity': 0.85 }, svg);
      if (!T.reduced) T.el('animate', { attributeName: 'stroke-dashoffset', from: 20, to: 0, dur: '0.6s', repeatCount: 'indefinite' }, streams[id]);
      open[id] = true;
    });
    const hole = T.el('ellipse', { cx: 160, cy: 132, rx: 58, ry: 16, fill: '#000', stroke: IV, 'stroke-width': 1.5 }, svg);
    const breath = T.el('ellipse', { cx: 160, cy: 132, rx: 10, ry: 3, fill: 'none', stroke: IV, 'stroke-width': 1.2, opacity: 0 }, svg);
    const needle = T.text(svg, 160, 168, 'LLENO: 0 %', { 'font-size': 11, 'letter-spacing': 1.5, opacity: 0.8 });
    const acts = T.acts();
    const btns = {};
    let breaths = 0, inNext = true;
    const quiet = () => chutes.every(([id]) => !open[id]);
    const refresh = () => {
      const n = chutes.filter(([id]) => !open[id]).length;
      T.progress(quiet() ? 0.6 + breaths * 0.065 : n * 0.12);
      breathBtn.hidden = !quiet();
      if (!quiet()) { breaths = 0; inNext = true; breath.setAttribute('opacity', 0); setBreath(); }
    };
    for (const [id, name] of chutes) {
      btns[id] = T.btn(acts, `CERRAR ${name}`, 'cerrar-' + id, () => {
        open[id] = !open[id];
        streams[id].style.display = open[id] ? '' : 'none';
        btns[id].textContent = `${open[id] ? 'CERRAR' : 'ABRIR'} ${name}`;
        btns[id].dataset.act = (open[id] ? 'cerrar-' : 'abrir-') + id;
        btns[id].setAttribute('aria-pressed', String(!open[id]));
        refresh();
        T.say(quiet() ? 'El hueco queda quieto. El vacío no se inventa: viene con nosotros. Da miedo quedarse.' : open[id] ? `Vuelve a entrar ${name.toLowerCase()}.` : `Dejó de entrar ${name.toLowerCase()}. El hueco sigue igual de vacío.`);
      });
    }
    T.btn(acts, 'ECHAR MÁS', 'mas', () => {
      for (const [id] of chutes) if (!open[id]) { open[id] = true; streams[id].style.display = ''; btns[id].textContent = `CERRAR ${chutes.find((c) => c[0] === id)[1]}`; btns[id].dataset.act = 'cerrar-' + id; btns[id].setAttribute('aria-pressed', 'false'); }
      refresh();
      needle.textContent = 'LLENO: 0 %';
      T.say('Entra más, todo junto. La aguja no se mueve: no se llena.');
    });
    const setBreath = () => { breathBtn.textContent = inNext ? 'INHALAR' : 'EXHALAR'; breathBtn.dataset.act = inNext ? 'inhalar' : 'exhalar'; };
    const breathBtn = T.btn(acts, 'INHALAR', 'inhalar', () => {
      if (!quiet()) return;
      breath.setAttribute('opacity', 0.9);
      breath.setAttribute('rx', inNext ? 44 : 14); breath.setAttribute('ry', inNext ? 12 : 4);
      if (!inNext) { breaths++; T.say(breaths < 3 ? ['En el silencio del aire.', 'Sin huir.'][breaths - 1] : ''); }
      inNext = !inNext; setBreath(); refresh();
      if (breaths >= 3) T.solve();
    }, { wide: true });
    breathBtn.hidden = true;
    hole.setAttribute('fill-opacity', 1);
  },
};
